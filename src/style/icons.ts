import { LabIcon } from '@jupyterlab/ui-components';

// icon svg import statements
import gitSvg from '../../style/images/git-icon.svg';
import deletionsMadeSvg from '../../style/images/deletions-made-icon.svg';
import insertionsMadeSvg from '../../style/images/insertions-made-icon.svg';

export const gitIcon = new LabIcon({ name: 'git', svgstr: gitSvg });
export const deletionsMadeIcon = new LabIcon({
  name: 'git-deletionsMade',
  svgstr: deletionsMadeSvg
});
export const insertionsMadeIcon = new LabIcon({
  name: 'git-insertionsMade',
  svgstr: insertionsMadeSvg
});
