import { LabIcon } from '@jupyterlab/ui-components';

// icon svg import statements
import deletionsSvgstr from '../style/icons/deletions.svg';
import diffSvgstr from '../style/icons/diff.svg';
import gitSvgstr from '../style/icons/git.svg';
import insertionsSvgstr from '../style/icons/insertions.svg';

export const deletionsIcon = new LabIcon({ name: 'git:deletions', svgstr: deletionsSvgstr });
export const diffIcon = new LabIcon({ name: 'git:diff', svgstr: diffSvgstr });
export const gitIcon = new LabIcon({ name: 'git:git', svgstr: gitSvgstr });
export const insertionsIcon = new LabIcon({ name: 'git:insertions', svgstr: insertionsSvgstr });
