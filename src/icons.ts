import { LabIcon } from '@jupyterlab/ui-components';

// icon svg import statements
import gitSvgstr from '../style/images/git.svg';
import deletionsSvgstr from '../style/images/deletions.svg';
import insertionsSvgstr from '../style/images/insertions.svg';

export const gitIcon = new LabIcon({ name: 'git:git', svgstr: gitSvgstr });
export const deletionsIcon = new LabIcon({ name: 'git:deletions', svgstr: deletionsSvgstr });
export const insertionsIcon = new LabIcon({ name: 'git:insertions', svgstr: insertionsSvgstr });
