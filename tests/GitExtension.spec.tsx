import { testEmission } from '@jupyterlab/testutils';
import 'jest';
import * as git from '../src/git';
import { GitExtension } from '../src/model';
import { IGitExtension, Git } from '../src/tokens';

jest.mock('../src/git');

describe('IGitExtension', () => {
  const mockGit = git as jest.Mocked<typeof git>;
  const fakeRoot = '/path/to/server';
  let model: IGitExtension;
  let mockResponses: {
    [url: string]: {
      body?: (request: Object) => string;
      status?: number;
    };
  };

  beforeEach(async () => {
    jest.restoreAllMocks();

    mockResponses = {
      '/git/branch': {
        body: request =>
          JSON.stringify({
            code: 0,
            branches: [],
            current_branch: null
          })
      },
      '/git/show_top_level': {
        body: request =>
          JSON.stringify({
            code: 0,
            top_repo_path: (request as any)['current_path']
          })
      },
      '/git/server_root': {
        body: () =>
          JSON.stringify({
            server_root: fakeRoot
          })
      },
      '/git/status': {
        body: () =>
          JSON.stringify({
            code: 0,
            files: []
          })
      }
    };

    mockGit.httpGitRequest.mockImplementation((url, method, request) => {
      let response: Response;
      if (url in mockResponses) {
        response = new Response(
          mockResponses[url].body
            ? mockResponses[url].body(request)
            : undefined,
          {
            status: mockResponses[url].status
          }
        );
      } else {
        response = new Response(
          `{"message": "No mock implementation for ${url}."}`,
          { status: 404 }
        );
      }
      return Promise.resolve(response);
    });

    const app = {
      commands: {
        hasCommand: jest.fn().mockReturnValue(true)
      }
    };
    model = new GitExtension(app as any);
  });

  describe('#constructor', () => {
    it('should have requested the server root folder', () => {
      expect(mockGit.httpGitRequest).toBeCalledWith(
        '/git/server_root',
        'GET',
        null
      );
    });
  });

  describe('#pathRepository', () => {
    it('should be null if not in a git repository', async () => {
      const path = '/path/to/server/repo';
      expect(model.pathRepository).toBeNull();

      model.pathRepository = path;
      await model.ready;
      expect(model.pathRepository).toBe(path);

      model.pathRepository = null;
      await model.ready;
      expect(model.pathRepository).toBeNull();
    });

    it('should be equal to the top repository folder', async () => {
      const path = '/path/to/server/repo';

      mockResponses = {
        ...mockResponses,
        '/git/show_top_level': {
          body: request =>
            JSON.stringify({
              code: 0,
              top_repo_path: path
            })
        }
      };

      model.pathRepository = path + '/subdir';
      await model.ready;
      expect(model.pathRepository).toBe(path);
    });

    it('should not be ready before all requests have be processed.', async () => {
      const path = '/path/to/server/repo';

      expect(model.isReady).toBe(true);

      model.pathRepository = path + '/subdir';
      expect(model.isReady).toBe(false);
      await model.ready;
      expect(model.isReady).toBe(true);
      expect(model.pathRepository).toBe(path + '/subdir');

      model.pathRepository = path + '/subdir';
      model.ready.then(() => {
        expect(model.isReady).toBe(false);
      });
      model.pathRepository = null;
      model.ready.then(() => {
        expect(model.isReady).toBe(false);
      });
      model.pathRepository = path;
      expect(model.isReady).toBe(false);
      await model.ready;
      expect(model.isReady).toBe(true);
      expect(model.pathRepository).toBe(path);
    });

    it('should emit repositoryChanged signal and request a refresh', async () => {
      let path = '/path/to/server/repo';

      const testPathSignal = testEmission(model.repositoryChanged, {
        test: (model, change) => {
          expect(change.newValue).toBe(path);
        }
      });

      const testStatusSignal = testEmission(model.statusChanged, {
        test: (caller, files) => {
          expect(caller).toBe(model);
        }
      });

      model.pathRepository = path;
      await model.ready;
      await testPathSignal;
      await testStatusSignal;

      path = null;
      model.pathRepository = path;
      await model.ready;
      await testPathSignal;
      await testStatusSignal;
    });
  });

  describe('#status', () => {
    it('should be an empty list if not in a git repository', async () => {
      let status: Git.IStatusFileResult[] = [];
      mockResponses = {
        ...mockResponses,
        '/git/status': {
          body: () => JSON.stringify({ files: status })
        }
      };
      expect(model.pathRepository).toBeNull();
      expect(model.status).toHaveLength(0);

      model.pathRepository = '/path/to/server/repo';
      await model.ready;
      status = [{ x: '', y: '', from: '', to: '', is_binary: null }];
      await model.refreshStatus();
      expect(model.status).toHaveLength(1);

      model.pathRepository = null;
      await model.ready;
      await model.refreshStatus();
      expect(model.status).toHaveLength(0);
    });

    it('should emit a signal if when set', async () => {
      let status: Git.IStatusFileResult[] = [];
      mockResponses = {
        ...mockResponses,
        '/git/status': {
          body: () => JSON.stringify({ files: status })
        }
      };

      const testSignal = testEmission(model.statusChanged, {
        test: (model, files) => {
          expect(files).toHaveLength(status.length);
          expect(files[0]).toMatchObject<Git.IStatusFileResult>({
            ...status[0]
          });
        }
      });

      model.pathRepository = '/path/to/server/repo';
      await model.ready;
      status = [{ x: '', y: '', from: '', to: '', is_binary: null }];
      await model.refreshStatus();
      await testSignal;
    });
  });

  describe('#getRelativeFilePath', () => {
    it('should return relative path correctly ', async () => {
      const testData = [
        [
          'somefolder/file',
          '/path/to/server/dir1/dir2/repo',
          'dir1/dir2/repo/somefolder/file'
        ],
        ['file', '/path/to/server/repo', 'repo/file'],
        ['somefolder/file', '/path/to/server/repo', 'repo/somefolder/file'],
        ['somefolder/file', '/path/to/server', 'somefolder/file'],
        ['file', '/path/to/server', 'file'],
        ['file', null, null]
      ];

      for (const testDatum of testData) {
        // Given
        model.pathRepository = testDatum[1];
        await model.ready;
        // When
        const relativePath = model.getRelativeFilePath(testDatum[0]);
        // Then
        expect(relativePath).toEqual(testDatum[2]);
      }
    });
  });

  describe('#checkout', () => {
    it('should emit headChanged signal if checkout branch', async () => {
      mockResponses = {
        ...mockResponses,
        '/git/checkout': {
          body: () => '{}'
        }
      };

      model.pathRepository = '/path/to/server/repo';
      await model.ready;

      const testSignal = testEmission(model.headChanged, {
        test: (model, _) => {
          expect(_).toBeUndefined();
        }
      });

      await model.checkout({ branchname: 'dummy' });
      await testSignal;
    });
  });

  describe('#pull', () => {
    it('should emit headChanged signal if successful', async () => {
      mockResponses = {
        ...mockResponses,
        '/git/pull': {
          body: () => '{}'
        }
      };

      model.pathRepository = '/path/to/server/repo';
      await model.ready;

      const testSignal = testEmission(model.headChanged, {
        test: (model, _) => {
          expect(_).toBeUndefined();
        }
      });

      await model.pull();
      await testSignal;
    });
  });

  describe('#push', () => {
    it('should emit headChanged signal if successful', async () => {
      mockResponses = {
        ...mockResponses,
        '/git/push': {
          body: () => '{}'
        }
      };

      model.pathRepository = '/path/to/server/repo';
      await model.ready;

      const testSignal = testEmission(model.headChanged, {
        test: (model, _) => {
          expect(_).toBeUndefined();
        }
      });

      await model.push();
      await testSignal;
    });
  });

  describe('#resetToCommit', () => {
    it('should emit headChanged signal if successfully reset to commit', async () => {
      mockResponses = {
        ...mockResponses,
        '/git/reset_to_commit': {
          body: () => '{}'
        }
      };

      model.pathRepository = '/path/to/server/repo';
      await model.ready;

      const testSignal = testEmission(model.headChanged, {
        test: (model, _) => {
          expect(_).toBeUndefined();
        }
      });

      await model.resetToCommit('dummyhash');
      await testSignal;
    });
  });
});
