import { testEmission } from '@jupyterlab/testutils';
import 'jest';
import * as git from '../src/git';
import { GitExtension } from '../src/model';
import { Git, IGitExtension } from '../src/tokens';
import {
  defaultMockedResponses,
  DEFAULT_REPOSITORY_PATH,
  IMockedResponses,
  mockedRequestAPI
} from './utils';

jest.mock('../src/git');

describe('IGitExtension', () => {
  const mockGit = git as jest.Mocked<typeof git>;
  let model: IGitExtension;
  const docmanager = jest.mock('@jupyterlab/docmanager') as any;
  let mockResponses: IMockedResponses;

  beforeEach(async () => {
    jest.restoreAllMocks();
    docmanager.findWidget = jest.fn();
    const docregistry = {
      getFileTypesForPath: jest.fn().mockReturnValue([])
    };

    mockResponses = {
      responses: { ...defaultMockedResponses }
    };

    mockGit.requestAPI.mockImplementation(mockedRequestAPI(mockResponses));

    model = new GitExtension(docmanager as any, docregistry as any);
  });

  describe('#pathRepository', () => {
    it('should be null if not in a git repository', async () => {
      const path = DEFAULT_REPOSITORY_PATH;
      expect(model.pathRepository).toBeNull();

      model.pathRepository = path;
      await model.ready;
      expect(model.pathRepository).toBe(path);

      model.pathRepository = null;
      await model.ready;
      expect(model.pathRepository).toBeNull();
    });

    it('should be equal to the top repository folder', async () => {
      mockResponses.path = DEFAULT_REPOSITORY_PATH + '/subdir';

      mockResponses.responses['show_prefix'] = {
        body: () => {
          return {
            code: 0,
            path: 'subdir/'
          };
        }
      };

      model.pathRepository = mockResponses.path;
      await model.ready;
      expect(model.pathRepository).toBe(DEFAULT_REPOSITORY_PATH);
    });

    it('should not be ready before all requests have be processed.', async () => {
      mockResponses.path = DEFAULT_REPOSITORY_PATH + '/subdir';

      expect(model.isReady).toBe(true);

      model.pathRepository = mockResponses.path;
      expect(model.isReady).toBe(false);
      await model.ready;
      expect(model.isReady).toBe(true);
      expect(model.pathRepository).toBe(mockResponses.path);

      model.pathRepository = mockResponses.path;
      model.ready.then(() => {
        expect(model.isReady).toBe(false);
      });
      model.pathRepository = null;
      model.ready.then(() => {
        expect(model.isReady).toBe(false);
      });

      mockResponses.path = DEFAULT_REPOSITORY_PATH;
      model.pathRepository = mockResponses.path;
      expect(model.isReady).toBe(false);
      await model.ready;
      expect(model.isReady).toBe(true);
      expect(model.pathRepository).toBe(mockResponses.path);
    });

    it('should emit repositoryChanged signal and request a refresh', async () => {
      let path = DEFAULT_REPOSITORY_PATH;

      const testPathSignal = testEmission(model.repositoryChanged, {
        test: (model, change) => {
          expect(change.newValue).toBe(path);
        }
      });

      model.pathRepository = path;
      await model.ready;
      await testPathSignal;

      path = null;
      model.pathRepository = path;
      await model.ready;
      await testPathSignal;
    });
  });

  describe('#showPrefix', () => {
    it('should return a string if the folder is a git repository', async () => {
      const fakeRepo = 'cwd/';
      mockResponses.path = 'repo/cwd';
      mockResponses.responses['show_prefix'] = {
        body: () => {
          return { code: 0, path: fakeRepo };
        }
      };
      const relativePath = await model.showPrefix(mockResponses.path);
      expect(relativePath).toEqual(fakeRepo);
    });

    it('should return null if the repository is not a git repository', async () => {
      mockResponses.path = 'repo/cwd';
      mockResponses.responses['show_prefix'] = {
        body: () => {
          return { code: 128, path: null };
        },
        status: 500
      };
      const topLevel = await model.showPrefix(mockResponses.path);
      expect(topLevel).toBeNull();
    });

    it('should throw an exception if the server otherwise', async () => {
      mockResponses.path = 'repo/cwd';
      mockResponses.responses['show_prefix'] = {
        body: () => {
          return { code: 128 };
        },
        status: 401
      };
      try {
        await model.showPrefix(mockResponses.path);
      } catch (error) {
        expect(error).toBeInstanceOf(Git.GitResponseError);
      }
    });
  });

  describe('#showTopLevel', () => {
    it('should return a string if the folder is a git repository', async () => {
      mockResponses.path = DEFAULT_REPOSITORY_PATH + '/cwd';
      const fakeRepo = '/path/to/repo';
      mockResponses.responses['show_top_level'] = {
        body: () => {
          return { code: 0, path: fakeRepo };
        }
      };
      const topLevel = await model.showTopLevel(mockResponses.path);
      expect(topLevel).toEqual(fakeRepo);
    });

    it('should return null if the repository is not a git repository', async () => {
      mockResponses.path = DEFAULT_REPOSITORY_PATH + '/cwd';
      mockResponses.responses['show_top_level'] = {
        body: () => {
          return { code: 128 };
        },
        status: 500
      };
      const topLevel = await model.showTopLevel(mockResponses.path);
      expect(topLevel).toBeNull();
    });

    it('should throw an exception if the server otherwise', async () => {
      mockResponses.path = DEFAULT_REPOSITORY_PATH + '/cwd';
      mockResponses.responses['show_top_level'] = {
        body: () => {
          return { code: 128 };
        },
        status: 401
      };
      try {
        await model.showTopLevel(mockResponses.path);
      } catch (error) {
        expect(error).toBeInstanceOf(Git.GitResponseError);
      }
    });
  });

  describe('#status', () => {
    it('should be clear if not in a git repository', async () => {
      let status: Partial<Git.IStatusResult> = {
        branch: null,
        remote: null,
        ahead: 0,
        behind: 0,
        files: []
      };

      mockResponses.responses['status'] = {
        body: () => {
          return { code: 0, ...status } as any;
        }
      };
      expect(model.pathRepository).toBeNull();
      expect(model.status.branch).toBeNull();
      expect(model.status.files).toHaveLength(0);

      model.pathRepository = DEFAULT_REPOSITORY_PATH;
      const branch = 'master';
      await model.ready;
      status = {
        branch,
        remote: null,
        ahead: 0,
        behind: 0,
        files: [{ x: '', y: '', from: '', to: '', is_binary: null }]
      };
      await model.refreshStatus();
      expect(model.status.branch).toEqual(branch);
      expect(model.status.files).toHaveLength(1);

      model.pathRepository = null;
      await model.ready;
      await model.refreshStatus();
      expect(model.status.branch).toBeNull();
      expect(model.status.files).toHaveLength(0);
    });

    it('should emit a signal if when set', async () => {
      const branch = 'master';
      const status: Partial<Git.IStatusResult> = {
        branch,
        remote: null,
        ahead: 0,
        behind: 0,
        files: [{ x: '', y: '', from: '', to: '', is_binary: null }]
      };

      mockResponses.responses['status'] = {
        body: () => {
          return { code: 0, ...status } as any;
        }
      };

      const testSignal = testEmission(model.statusChanged, {
        test: (model, receivedStatus) => {
          expect(receivedStatus.branch).toEqual(branch);
          expect(receivedStatus.files).toHaveLength(status.files.length);
          expect(receivedStatus.files[0]).toMatchObject<Git.IStatusFileResult>({
            ...status.files[0]
          });
        }
      });

      model.pathRepository = DEFAULT_REPOSITORY_PATH;
      await model.ready;

      await model.refreshStatus();
      await testSignal;
    });
  });

  describe('#getFile', () => {
    it.each([
      ['dir1/dir2/repo/somefolder/file', 'somefolder/file', 'dir1/dir2/repo'],
      ['repo/file', 'file', 'repo'],
      ['repo/somefolder/file', 'somefolder/file', 'repo'],
      ['somefolder/file', 'somefolder/file', ''],
      ['file', 'file', ''],
      ['file', null, null],
      ['other_repo/file', null, 'repo'],
      ['root/other_repo/file', null, 'root/repo']
    ])(
      '%s should return unmodified status with path relative to the repository',
      async (path, expected, repo) => {
        // Given
        mockResponses.path = repo;
        model.pathRepository = repo;
        await model.ready;
        // When
        const status = model.getFile(path);
        // Then
        if (expected === null) {
          expect(status).toBeNull();
        } else {
          expect(status.status).toEqual('unmodified');
          expect(status.to).toEqual(expected);
        }
      }
    );
  });

  describe('#getRelativeFilePath', () => {
    it.each([
      ['somefolder/file', 'dir1/dir2/repo', 'dir1/dir2/repo/somefolder/file'],
      ['file', 'repo', 'repo/file'],
      ['somefolder/file', 'repo', 'repo/somefolder/file'],
      ['somefolder/file', '', 'somefolder/file'],
      ['file', '', 'file'],
      ['file', null, null]
    ])(
      '%s should return relative path correctly ',
      async (path, repo, expected) => {
        // Given
        mockResponses.path = repo;
        model.pathRepository = repo;
        await model.ready;
        // When
        const relativePath = model.getRelativeFilePath(path);
        // Then
        expect(relativePath).toEqual(expected);
      }
    );
  });

  describe('#checkout', () => {
    it('should emit headChanged signal if checkout branch', async () => {
      mockResponses.responses['checkout'] = {
        body: () => {
          return {};
        }
      };
      mockResponses.responses['branch'] = {
        body: () => {
          return {
            code: 0,
            branches: [
              {
                is_current_branch: true,
                is_remote_branch: false,
                name: 'master',
                upstream: null,
                top_commit: '52263564aac988a0888060becc3c76d1023e680f',
                tag: null
              },
              {
                is_current_branch: false,
                is_remote_branch: false,
                name: 'test-branch',
                upstream: null,
                top_commit: '52263564aac988a0888060becc3c76d1023e680f',
                tag: null
              }
            ],
            current_branch: {
              is_current_branch: true,
              is_remote_branch: false,
              name: 'master',
              upstream: null,
              top_commit: '52263564aac988a0888060becc3c76d1023e680f',
              tag: null
            }
          };
        }
      };
      mockResponses.responses['changed_files'] = {
        body: () => {
          return {
            code: 0,
            files: ['']
          };
        }
      };

      model.pathRepository = DEFAULT_REPOSITORY_PATH;
      await model.ready;

      const testSignal = testEmission(model.headChanged, {
        test: (model, _) => {
          expect(_).toBeUndefined();
        }
      });

      await model.refreshBranch();
      await model.checkout({ branchname: 'test-branch' });
      await testSignal;
    });
  });

  describe('#pull', () => {
    it('should refresh branches if successful', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'refreshBranch');
      mockResponses.responses['pull'] = {
        body: () => null
      };

      model.pathRepository = DEFAULT_REPOSITORY_PATH;
      await model.ready;

      await model.pull();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith();

      spy.mockReset();
      spy.mockRestore();
    });
  });

  describe('#push', () => {
    it('should refresh branches  if successful', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'refreshBranch');
      mockResponses.responses['push'] = {
        body: () => null
      };

      model.pathRepository = DEFAULT_REPOSITORY_PATH;
      await model.ready;

      await model.push();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith();

      spy.mockReset();
      spy.mockRestore();
    });
  });

  describe('#resetToCommit', () => {
    it('should refresh branches if successfully reset to commit', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'refreshBranch');
      mockResponses.responses['reset_to_commit'] = {
        body: () => null
      };
      mockResponses.responses['changed_files'] = {
        body: () => {
          return {
            code: 0,
            files: ['made-up-file.md']
          };
        }
      };

      model.pathRepository = DEFAULT_REPOSITORY_PATH;
      await model.ready;

      await model.resetToCommit('dummyhash');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith();

      spy.mockReset();
      spy.mockRestore();
    });
  });
});
