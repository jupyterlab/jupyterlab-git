import { JLIcon } from '@jupyterlab/ui-components';

// icon svg import statements
import gitSvg from '../../style/images/git-icon.svg';
import deletionsMadeSvg from '../../style/images/deletions-made-icon.svg';
import insertionsMadeSvg from '../../style/images/insertions-made-icon.svg';

export const gitIcon = new JLIcon({ name: 'git', svgstr: gitSvg });
export const deletionsMadeIcon = new JLIcon({
  name: 'git-deletionsMade',
  svgstr: deletionsMadeSvg
});
export const insertionsMadeIcon = new JLIcon({
  name: 'git-insertionsMade',
  svgstr: insertionsMadeSvg
});
