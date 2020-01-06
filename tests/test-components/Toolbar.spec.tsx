import * as React from 'react';
import { shallow } from 'enzyme';
import { IToolbarProps, Toolbar } from '../../src/components/Toolbar';
import {
  pullButtonClass,
  pushButtonClass,
  refreshButtonClass
} from '../../src/style/Toolbar';
import 'jest';
import { GitExtension } from '../../src/model';
import * as git from '../../src/git';

jest.mock('../../src/git');

describe('Toolbar', function() {
  let props: IToolbarProps;

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
    const node = shallow(<Toolbar {...props} />);

    const buttons = node.find('button');
    expect(buttons).toHaveLength(3);
    expect(buttons.find(`.${pullButtonClass}`)).toHaveLength(1);
    expect(buttons.find(`.${pullButtonClass}`).prop('title')).toEqual(
      'Pull latest changes'
    );
    expect(buttons.find(`.${pushButtonClass}`)).toHaveLength(1);
    expect(buttons.find(`.${pushButtonClass}`).prop('title')).toEqual(
      'Push committed changes'
    );
    expect(buttons.find(`.${refreshButtonClass}`)).toHaveLength(1);
  });

  it('should call API on button click', function() {
    const spyPull = jest.spyOn(GitExtension.prototype, 'pull');
    const spyPush = jest.spyOn(GitExtension.prototype, 'push');

    const node = shallow(<Toolbar {...props} />);
    const buttons = node.find('button');

    buttons.find(`.${pullButtonClass}`).simulate('click');
    expect(spyPull).toHaveBeenCalledTimes(1);
    expect(spyPull).toHaveBeenCalledWith(undefined);

    buttons.find(`.${pushButtonClass}`).simulate('click');
    expect(spyPush).toHaveBeenCalledTimes(1);
    expect(spyPush).toHaveBeenCalledWith(undefined);
  });
});
