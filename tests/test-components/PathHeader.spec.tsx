import * as React from "react";
import {shallow} from "enzyme";
import {IPathHeaderProps, PathHeader} from "../../src/components/PathHeader";
import {gitPullStyle, gitPushStyle, repoRefreshStyle} from "../../src/componentsStyle/PathHeaderStyle";
import 'jest';
import {Git} from '../../src/git';

describe('PathHeader', function () {
  const props: IPathHeaderProps = {
    currentFileBrowserPath: '/path/to/repo',
    topRepoPath: '/foo',
    refresh: null,
    currentBranch: 'bar',
    isLightTheme: 'true'
  };

  it('should have repo and branch details', function () {
    // When
    const node = shallow(<PathHeader {...props} />);

    // Then
    expect(node.text()).toEqual('repo / bar');
  });

  it('should have all buttons in light theme', function () {
    // When
    const node = shallow(<PathHeader {...props} />);

    // Then
    const buttons = node.find('button');
    expect(buttons).toHaveLength(3);
    expect(buttons.find(`.${gitPullStyle('true')}`)).toHaveLength(1);
    expect(buttons.find(`.${gitPullStyle('true')}`).prop('title')).toEqual('Pull latest changes');
    expect(buttons.find(`.${gitPushStyle('true')}`)).toHaveLength(1);
    expect(buttons.find(`.${gitPushStyle('true')}`).prop('title')).toEqual('Push committed changes');
    expect(buttons.find(`.${repoRefreshStyle}`)).toHaveLength(1);
  });

  it('should have all buttons in dark theme', function () {
      const props: IPathHeaderProps = {
    currentFileBrowserPath: '/path/to/repo',
    topRepoPath: '/foo',
    refresh: null,
    currentBranch: 'bar',
    isLightTheme: 'false'
  };
    // When
    const node = shallow(<PathHeader {...props} />);

    // Then
    const buttons = node.find('button');
    expect(buttons).toHaveLength(3);
    expect(buttons.find(`.${gitPullStyle('false')}`)).toHaveLength(1);
    expect(buttons.find(`.${gitPullStyle('false')}`).prop('title')).toEqual('Pull latest changes');
    expect(buttons.find(`.${gitPushStyle('false')}`)).toHaveLength(1);
    expect(buttons.find(`.${gitPushStyle('false')}`).prop('title')).toEqual('Push committed changes');
    expect(buttons.find(`.${repoRefreshStyle}`)).toHaveLength(1);
  });

  it('should call API on button click', function () {
    // Given
    const spyPull = jest.spyOn(Git.prototype, 'pull');
    const spyPush = jest.spyOn(Git.prototype, 'push');

    // When
    const node = shallow(<PathHeader {...props} />);

    // Then
    const buttons = node.find('button');

    buttons.find(`.${gitPullStyle('true')}`).simulate('click');
    expect(spyPull).toHaveBeenCalledTimes(1);
    expect(spyPull).toHaveBeenCalledWith('/path/to/repo');

    buttons.find(`.${gitPushStyle('true')}`).simulate('click');
    expect(spyPush).toHaveBeenCalledTimes(1);
    expect(spyPush).toHaveBeenCalledWith('/path/to/repo');
  });
});