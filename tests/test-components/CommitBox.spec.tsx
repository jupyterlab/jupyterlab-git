import 'jest';
import { CommitBox } from '../../src/components/CommitBox';
import { classes } from 'typestyle';
import {
  stagedCommitButtonStyle,
  stagedCommitButtonReadyStyle,
  stagedCommitButtonDisabledStyle
} from '../../src/style/BranchHeaderStyle';

describe('CommitBox', () => {
  describe('#checkReadyForSubmit()', () => {
    it('should update commit box state to be ready when changes are staged', () => {
      const box = new CommitBox({
        onCommit: async () => {},
        hasFiles: true
      });

      // TODO: this sort of testing should be performed during UI/UX testing, not unit testing
      let actual = box._commitButtonStyle(true);

      let expected = classes(
        stagedCommitButtonStyle,
        stagedCommitButtonReadyStyle
      );
      expect(actual).toEqual(expected);
    });

    it('should update commit box state to be disabled when no changes are staged', () => {
      const box = new CommitBox({
        onCommit: async () => {},
        hasFiles: true
      });

      // TODO: this sort of testing should be performed during UI/UX testing, not unit testing
      let actual = box._commitButtonStyle(false);
      let expected = classes(
        stagedCommitButtonStyle,
        stagedCommitButtonDisabledStyle
      );
      expect(actual).toEqual(expected);
    });

    it('should be ready to commit with a message set', () => {
      const box = new CommitBox({
        onCommit: async () => {},
        hasFiles: true
      });
      // can't use setState here, since the box hasn't actually mounted
      box.state = { value: 'message' };

      // TODO: this sort of testing should be performed during UI/UX testing, not unit testing
      let actual = box._commitButtonStyle(true);
      let expected = stagedCommitButtonStyle;
      expect(actual).toEqual(expected);
    });
  });
});
