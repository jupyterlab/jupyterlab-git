import 'jest';
import {
  BranchHeader,
  IBranchHeaderProps
} from '../../src/components/BranchHeader';
import { branchStyle } from '../../src/style/BranchHeaderStyle';
import { GitExtension } from '../../src/model';
import * as git from '../../src/git';

jest.mock('../../src/git');

describe('BranchHeader', () => {
  const props: IBranchHeaderProps = {
    model: null,
    currentBranch: 'master',
    sideBarExpanded: false,
    upstreamBranch: 'origin/master',
    data: [
      {
        is_current_branch: true,
        is_remote_branch: false,
        name: 'master',
        upstream: '',
        top_commit: '',
        tag: ''
      },
      {
        is_current_branch: true,
        is_remote_branch: false,
        name: 'feature-1',
        upstream: '',
        top_commit: '',
        tag: ''
      },
      {
        is_current_branch: true,
        is_remote_branch: false,
        name: 'feature-2',
        upstream: '',
        top_commit: '',
        tag: ''
      },
      {
        is_current_branch: true,
        is_remote_branch: false,
        name: 'patch-007',
        upstream: '',
        top_commit: '',
        tag: ''
      }
    ],
    refresh: () => Promise.resolve(),
    disabled: false,
    toggleSidebar: function() {
      return true;
    }
  };

  describe('#constructor()', () => {
    let branchHeader: BranchHeader = null;

    beforeEach(async () => {
      const fakeRoot = '/foo';
      const mockGit = git as jest.Mocked<typeof git>;
      mockGit.httpGitRequest.mockImplementation((url, method, request) => {
        if (url === '/git/server_root') {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                server_root: fakeRoot
              })
            )
          );
        }
      });
      props.model = new GitExtension();

      branchHeader = new BranchHeader(props);
    });

    it('should construct a new branch header', () => {
      expect(branchHeader).toBeInstanceOf(BranchHeader);
    });

    it('should set default values correctly', () => {
      expect(branchHeader.state.dropdownOpen).toEqual(false);
      expect(branchHeader.state.showNewBranchBox).toEqual(false);
    });
  });

  describe('#switchBranch()', () => {
    const branchHeader = new BranchHeader(props);
    it('should switch to specified branch', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');
      branchHeader.switchBranch('new-feature');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        branchname: 'new-feature' // Branch name
      });
      spy.mockRestore();
    });
  });

  describe('#createNewBranch()', () => {
    const branchHeader = new BranchHeader(props);
    it('should create and checkout new branch', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');
      branchHeader.createNewBranch('new-feature');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        newBranch: true, // Create new branch if it doesn't exist
        branchname: 'new-feature' // Branch name
      });
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
  });
});
