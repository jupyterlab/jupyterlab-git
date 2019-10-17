import { IIconRegistry } from '@jupyterlab/ui-components';

// icon svg import statements
import gitSvg from '../../style/images/git-icon.svg';
import deletionsMadeSvg from '../../style/images/deletions-made-icon.svg';
import insertionsMadeSvg from '../../style/images/insertions-made-icon.svg';

export function registerGitIcons(iconRegistry: IIconRegistry) {
  iconRegistry.addIcon(
    {
      name: 'git',
      svg: gitSvg
    },
    {
      name: 'git-deletionsMade',
      svg: deletionsMadeSvg
    },
    {
      name: 'git-insertionsMade',
      svg: insertionsMadeSvg
    }
  );
}
