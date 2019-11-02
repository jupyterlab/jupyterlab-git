import * as apputils from '@jupyterlab/apputils';
import 'jest';
import { FileList, IFileListProps } from '../../src/components/FileList';
import { GitExtension } from '../../src/model';
import * as git from '../../src/git';

jest.mock('../../src/git');

// Mock jupyterlab package
jest.mock('@jupyterlab/apputils');

describe('FileList', () => {
  const props: IFileListProps = {
    model: null,
    renderMime: null,
    stagedFiles: [],
    unstagedFiles: [],
    untrackedFiles: []
  };

  describe('#commitAllStagedFiles()', () => {
    let fileList: FileList = null;

    beforeEach(async () => {
      jest.restoreAllMocks();

      const fakePath = '/path/to/repo';
      const fakeRoot = '/foo';
      const mockGit = git as jest.Mocked<typeof git>;
      mockGit.httpGitRequest.mockImplementation((url, method, request) => {
        let response: Response;
        switch (url) {
          case '/git/commit':
            response = new Response();
            break;
          case '/git/show_top_level':
            response = new Response(
              JSON.stringify({
                code: 0,
                top_repo_path: (request as any)['current_path']
              })
            );
            break;
          case '/git/server_root':
            response = new Response(
              JSON.stringify({
                server_root: fakeRoot
              })
            );
            break;
          default:
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
      props.model = new GitExtension(app as any);
      props.model.pathRepository = fakePath;
      await props.model.ready;
      fileList = new FileList(props);
    });

    it('should commit when commit message is provided', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'commit');
      // Mock identity look up
      const identity = jest
        .spyOn(GitExtension.prototype, 'config')
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              options: {
                'user.name': 'John Snow',
                'user.email': 'john.snow@winteris.com'
              }
            }),
            { status: 201 }
          )
        );
      await fileList.commitAllStagedFiles('Initial commit');
      expect(identity).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('Initial commit');
    });

    it('should NOT commit when commit message is empty', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'commit');
      await fileList.commitAllStagedFiles('');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should prompt for user identity if user.name is unset', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'commit');
      // Mock identity look up
      const identity = jest
        .spyOn(GitExtension.prototype, 'config')
        .mockImplementation(options => {
          let response: Response = null;
          if (options === undefined) {
            response = new Response(
              JSON.stringify({
                options: {
                  'user.email': 'john.snow@winteris.com'
                }
              }),
              { status: 201 }
            );
          } else {
            response = new Response('', { status: 201 });
          }
          return Promise.resolve(response);
        });
      const mockApputils = apputils as jest.Mocked<typeof apputils>;
      mockApputils.showDialog.mockResolvedValue({
        button: {
          accept: true,
          caption: '',
          className: '',
          displayType: 'default',
          iconClass: '',
          iconLabel: '',
          label: ''
        },
        value: {
          name: 'John Snow',
          email: 'john.snow@winteris.com'
        }
      });

      await fileList.commitAllStagedFiles('Initial commit');
      expect(identity).toHaveBeenCalledTimes(2);
      expect(identity.mock.calls[0]).toHaveLength(0);
      expect(identity.mock.calls[1]).toEqual([
        {
          'user.name': 'John Snow',
          'user.email': 'john.snow@winteris.com'
        }
      ]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('Initial commit');
    });

    it('should prompt for user identity if user.email is unset', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'commit');
      // Mock identity look up
      const identity = jest
        .spyOn(GitExtension.prototype, 'config')
        .mockImplementation(options => {
          let response: Response = null;
          if (options === undefined) {
            response = new Response(
              JSON.stringify({
                options: {
                  'user.name': 'John Snow'
                }
              }),
              { status: 201 }
            );
          } else {
            response = new Response('', { status: 201 });
          }
          return Promise.resolve(response);
        });
      const mockApputils = apputils as jest.Mocked<typeof apputils>;
      mockApputils.showDialog.mockResolvedValue({
        button: {
          accept: true,
          caption: '',
          className: '',
          displayType: 'default',
          iconClass: '',
          iconLabel: '',
          label: ''
        },
        value: {
          name: 'John Snow',
          email: 'john.snow@winteris.com'
        }
      });

      await fileList.commitAllStagedFiles('Initial commit');
      expect(identity).toHaveBeenCalledTimes(2);
      expect(identity.mock.calls[0]).toHaveLength(0);
      expect(identity.mock.calls[1]).toEqual([
        {
          'user.name': 'John Snow',
          'user.email': 'john.snow@winteris.com'
        }
      ]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('Initial commit');
    });

    it('should NOT commit if no user identity is set and the user reject the dialog', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'commit');
      // Mock identity look up
      const identity = jest
        .spyOn(GitExtension.prototype, 'config')
        .mockImplementation(options => {
          let response: Response = null;
          if (options === undefined) {
            response = new Response(
              JSON.stringify({
                options: {}
              }),
              { status: 201 }
            );
          } else {
            response = new Response('', { status: 201 });
          }
          return Promise.resolve(response);
        });
      const mockApputils = apputils as jest.Mocked<typeof apputils>;
      mockApputils.showDialog.mockResolvedValue({
        button: {
          accept: false,
          caption: '',
          className: '',
          displayType: 'default',
          iconClass: '',
          iconLabel: '',
          label: ''
        },
        value: null
      });

      await fileList.commitAllStagedFiles('Initial commit');
      expect(identity).toHaveBeenCalledTimes(1);
      expect(identity).toHaveBeenCalledWith();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
