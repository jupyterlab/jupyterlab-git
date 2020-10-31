import { LabIcon } from '@jupyterlab/ui-components';

// icon svg import statements
import addSvg from '../../style/icons/add.svg';
import branchSvg from '../../style/icons/branch.svg';
import cloneSvg from '../../style/icons/clone.svg';
import deletionsMadeSvg from '../../style/icons/deletions.svg';
import desktopSvg from '../../style/icons/desktop.svg';
import diffSvg from '../../style/icons/diff.svg';
import discardSvg from '../../style/icons/discard.svg';
import gitSvg from '../../style/icons/git.svg';
import insertionsMadeSvg from '../../style/icons/insertions.svg';
import openSvg from '../../style/icons/open-file.svg';
import pullSvg from '../../style/icons/pull.svg';
import pushSvg from '../../style/icons/push.svg';
import removeSvg from '../../style/icons/remove.svg';
import rewindSvg from '../../style/icons/rewind.svg';
import tagSvg from '../../style/icons/tag.svg';
import trashSvg from '../../style/icons/trash.svg';

export const gitIcon = new LabIcon({ name: 'git', svgstr: gitSvg });
export const addIcon = new LabIcon({
  name: 'git:add',
  svgstr: addSvg
});
export const branchIcon = new LabIcon({
  name: 'git:branch',
  svgstr: branchSvg
});
export const cloneIcon = new LabIcon({
  name: 'git:clone',
  svgstr: cloneSvg
});
export const deletionsMadeIcon = new LabIcon({
  name: 'git:deletions',
  svgstr: deletionsMadeSvg
});
export const desktopIcon = new LabIcon({
  name: 'git:desktop',
  svgstr: desktopSvg
});
export const diffIcon = new LabIcon({
  name: 'git:diff',
  svgstr: diffSvg
});
export const discardIcon = new LabIcon({
  name: 'git:discard',
  svgstr: discardSvg
});
export const insertionsMadeIcon = new LabIcon({
  name: 'git:insertions',
  svgstr: insertionsMadeSvg
});
export const openIcon = new LabIcon({
  name: 'git:open-file',
  svgstr: openSvg
});
export const pullIcon = new LabIcon({
  name: 'git:pull',
  svgstr: pullSvg
});
export const pushIcon = new LabIcon({
  name: 'git:push',
  svgstr: pushSvg
});
export const removeIcon = new LabIcon({
  name: 'git:remove',
  svgstr: removeSvg
});
export const rewindIcon = new LabIcon({
  name: 'git:rewind',
  svgstr: rewindSvg
});
export const tagIcon = new LabIcon({
  name: 'git:tag',
  svgstr: tagSvg
});
export const trashIcon = new LabIcon({
  name: 'git:trash',
  svgstr: trashSvg
});
