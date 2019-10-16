import { IIconRegistry } from '@jupyterlab/ui-components';

// icon svg import statements
import gitSvg from '../style/images/git-icon.svg';

export function registerGitIcons(iconRegistry: IIconRegistry) {
  iconRegistry.addIcon({
    name: 'git',
    svg: gitSvg
  });
}
