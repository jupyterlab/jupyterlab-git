import { IIconRegistry } from '@jupyterlab/ui-components';

// icon svg import statements
import gitSvg from '../../style/images/git-icon.svg';
import deletionsMadeSvg from '../../style/images/deletions-made-icon.svg';
import diffSvg from '../../style/images/diff-hover.svg';
import discardSvg from '../../style/images/discard.svg';
import insertionsMadeSvg from '../../style/images/insertions-made-icon.svg';
import addSvg from '../../style/images/move-file-up.svg';
import removeSvg from '../../style/images/move-file-down.svg';
import rewindSvg from '../../style/images/rewind.svg';

export function registerGitIcons(iconRegistry: IIconRegistry) {
  iconRegistry.addIcon(
    {
      name: 'git',
      svg: gitSvg
    },
    {
      name: 'git-add',
      svg: addSvg
    },
    {
      name: 'git-deletionsMade',
      svg: deletionsMadeSvg
    },
    {
      name: 'git-diff',
      svg: diffSvg
    },
    {
      name: 'git-discard',
      svg: discardSvg
    },
    {
      name: 'git-insertionsMade',
      svg: insertionsMadeSvg
    },
    {
      name: 'git-remove',
      svg: removeSvg
    },
    {
      name: 'git-rewind',
      svg: rewindSvg
    }
  );
}
