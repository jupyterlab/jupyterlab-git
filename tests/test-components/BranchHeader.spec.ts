import {
  BranchHeader,
  IBranchHeaderProps
} from '../../src/components/BranchHeader';
import 'jest';
import { Git } from '../../src/git';
import { classes } from 'typestyle';
import {
  stagedCommitButtonStyle,
  stagedCommitButtonReadyStyle,
  stagedCommitButtonDisabledStyle,
  branchStyle,
  smallBranchStyle
} from '../../src/componentsStyle/BranchHeaderStyle';

describe('BranchHeader', () => {
  let props: IBranchHeaderProps = {
    currentFileBrowserPath: '/current/absolute/path',
    topRepoPath: '/absolute/path/to/git/repo',
    currentBranch: 'master',
    upstreamBranch: 'origin/master',
    stagedFiles: ['test-1', 'test-2'],
    data: ['master', 'feature-1', 'feature-2', 'patch-007'],
    refresh: 'update all content',
    disabled: false,
    toggleSidebar: function() {
      return true;
    },
    showList: true,
    currentTheme: 'dark'
  };

  describe('#constructor()', () => {
    const branchHeader = new BranchHeader(props);
    it('should construct a new branch header', () => {
      expect(branchHeader).toBeInstanceOf(BranchHeader);
    });
    it('should set default values correctly', () => {
      expect(branchHeader.state.dropdownOpen).toEqual(false);
      expect(branchHeader.state.showCommitBox).toEqual(true);
      expect(branchHeader.state.showNewBranchBox).toEqual(false);
    });
  });

  describe('#commitAllStagedFiles()', () => {
    const branchHeader = new BranchHeader(props);
    it('should commit when commit message is provided', () => {
      const spy = jest.spyOn(Git.prototype, 'commit');
      branchHeader.commitAllStagedFiles(
        'Initial commit',
        '/absolute/path/to/git/repo'
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        'Initial commit',
        '/absolute/path/to/git/repo'
      );
      spy.mockRestore();
    });
    it('should NOT commit when commit message is empty', () => {
      const spy = jest.spyOn(Git.prototype, 'commit');
      branchHeader.commitAllStagedFiles('', props.topRepoPath);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('#updateCommitBoxState()', () => {
    const branchHeader = new BranchHeader(props);
    it('should update commit box state to be ready when changes are staged', () => {
      let actual = branchHeader.updateCommitBoxState(true, 1);
      let expected = classes(
        stagedCommitButtonStyle,
        stagedCommitButtonReadyStyle
      );
      expect(actual).toEqual(expected);
    });
    it('should update commit box state to be disabled when no changes are staged', () => {
      let actual = branchHeader.updateCommitBoxState(true, 0);
      let expected = classes(
        stagedCommitButtonStyle,
        stagedCommitButtonDisabledStyle
      );
      expect(actual).toEqual(expected);
    });
    it('should update remove commit box when switching branch is enabled', () => {
      let actual = branchHeader.updateCommitBoxState(false, 0);
      let expected = stagedCommitButtonStyle;
      expect(actual).toEqual(expected);
    });
  });

  describe('#switchBranch()', () => {
    const branchHeader = new BranchHeader(props);
    it('should switch to specified branch', () => {
      const spy = jest.spyOn(Git.prototype, 'checkout');
      branchHeader.switchBranch('new-feature');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        true, // Checkout branch
        false, // Create new branch if it doesn't exist
        'new-feature', // Branch name
        false, // Discard all changes
        null, // File name to checkout
        '/current/absolute/path' // Current path
      );
      spy.mockRestore();
    });
  });

  describe('#createNewBranch()', () => {
    const branchHeader = new BranchHeader(props);
    it('should create and checkout new branch', () => {
      const spy = jest.spyOn(Git.prototype, 'checkout');
      branchHeader.createNewBranch('new-feature');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        true, // Checkout branch
        true, // Create new branch if it doesn't exist
        'new-feature', // Branch name
        false, // Discard all changes
        null, // File name to checkout
        '/current/absolute/path' // Current path
      );
      spy.mockRestore();
    });
  });

  describe('#getBranchStyle()', () => {
    it('should return correct branch style without drop down state', () => {
      const branchHeader = new BranchHeader(props);
      let actual = branchHeader.getBranchStyle();
      let expected = branchStyle;
      expect(actual).toEqual(expected);
    });
    it('should return correct branch style without drop down state and show list attribute', () => {
      const branchHeader = new BranchHeader({
        currentFileBrowserPath: '/current/absolute/path',
        topRepoPath: '/absolute/path/to/git/repo',
        currentBranch: 'master',
        upstreamBranch: 'origin/master',
        stagedFiles: ['test-1', 'test-2'],
        data: ['master', 'feature-1', 'feature-2', 'patch-007'],
        refresh: 'update all content',
        disabled: false,
        toggleSidebar: function() {
          return true;
        },
        showList: false,
        currentTheme: 'dark'
      });
      let actual = branchHeader.getBranchStyle();
      let expected = classes(branchStyle, smallBranchStyle);
      expect(actual).toEqual(expected);
    });
  });
});
