import { LabIcon } from '@jupyterlab/ui-components';
// icon svg import statements
import deletionsMadeSvg from '../../style/images/deletions-made-icon.svg';
import desktopSvg from '../../style/images/desktop.svg';
import diffSvg from '../../style/images/diff-hover.svg';
import discardSvg from '../../style/images/discard.svg';
import branchSvg from '../../style/images/git-branch.svg';
import gitSvg from '../../style/images/git-icon.svg';
import pullSvg from '../../style/images/git-pull.svg';
import pushSvg from '../../style/images/git-push.svg';
import insertionsMadeSvg from '../../style/images/insertions-made-icon.svg';
import removeSvg from '../../style/images/move-file-down.svg';
import addSvg from '../../style/images/move-file-up.svg';
import openSvg from '../../style/images/open-file.svg';
import rewindSvg from '../../style/images/rewind.svg';
import cloneSvg from '../../style/images/git-clone-icon.svg';

export const gitIcon = new LabIcon({ name: 'git', svgstr: gitSvg });
export const deletionsMadeIcon = new LabIcon({
  name: 'git-deletionsMade',
  svgstr: deletionsMadeSvg
});
export const insertionsMadeIcon = new LabIcon({
  name: 'git-insertionsMade',
  svgstr: insertionsMadeSvg
});
export const addIcon = new LabIcon({
  name: 'git-add',
  svgstr: addSvg
});
export const branchIcon = new LabIcon({
  name: 'git-branch',
  svgstr: branchSvg
});
export const cloneIcon = new LabIcon({
  name: 'git-clone',
  svgstr: cloneSvg
});
export const desktopIcon = new LabIcon({
  name: 'git-desktop',
  svgstr: desktopSvg
});
export const diffIcon = new LabIcon({
  name: 'git-diff',
  svgstr: diffSvg
});
export const discardIcon = new LabIcon({
  name: 'git-discard',
  svgstr: discardSvg
});
export const openIcon = new LabIcon({
  name: 'git-open-file',
  svgstr: openSvg
});
export const pullIcon = new LabIcon({
  name: 'git-pull',
  svgstr: pullSvg
});
export const pushIcon = new LabIcon({
  name: 'git-push',
  svgstr: pushSvg
});
export const removeIcon = new LabIcon({
  name: 'git-remove',
  svgstr: removeSvg
});
export const rewindIcon = new LabIcon({
  name: 'git-rewind',
  svgstr: rewindSvg
});
