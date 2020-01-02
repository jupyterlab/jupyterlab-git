import * as React from 'react';
import { shallow } from 'enzyme';
import { IPathHeaderProps, PathHeader } from '../../src/components/PathHeader';
import {
  gitPullStyle,
  gitPushStyle,
  repoRefreshStyle
} from '../../src/style/PathHeader';
import 'jest';
import { GitExtension } from '../../src/model';
import * as git from '../../src/git';

jest.mock('../../src/git');

describe('PathHeader', function() {
  let props: IPathHeaderProps;

  beforeEach(async () => {
    const fakePath = '/path/to/repo';
    const fakeRoot = '/foo';
    const mockGit = git as jest.Mocked<typeof git>;
    mockGit.httpGitRequest.mockImplementation((url, method, request) => {
      let response: Response;
      switch (url) {
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

    const model = new GitExtension();
    model.pathRepository = fakePath;
    await model.ready;

    props = {
      model: model,
      refresh: async () => {}
    };
  });

  it('should have all buttons', function() {
    // When
    const node = shallow(<PathHeader {...props} />);

    // Then
    const buttons = node.find('button');
    expect(buttons).toHaveLength(3);
    expect(buttons.find(`.${gitPullStyle}`)).toHaveLength(1);
    expect(buttons.find(`.${gitPullStyle}`).prop('title')).toEqual(
      'Pull latest changes'
    );
    expect(buttons.find(`.${gitPushStyle}`)).toHaveLength(1);
    expect(buttons.find(`.${gitPushStyle}`).prop('title')).toEqual(
      'Push committed changes'
    );
    expect(buttons.find(`.${repoRefreshStyle}`)).toHaveLength(1);
  });

  it('should call API on button click', function() {
    // Given
    const spyPull = jest.spyOn(GitExtension.prototype, 'pull');
    const spyPush = jest.spyOn(GitExtension.prototype, 'push');

    // When
    const node = shallow(<PathHeader {...props} />);

    // Then
    const buttons = node.find('button');

    buttons.find(`.${gitPullStyle}`).simulate('click');
    expect(spyPull).toHaveBeenCalledTimes(1);
    expect(spyPull).toHaveBeenCalledWith(undefined);

    buttons.find(`.${gitPushStyle}`).simulate('click');
    expect(spyPush).toHaveBeenCalledTimes(1);
    expect(spyPush).toHaveBeenCalledWith(undefined);
  });
});
