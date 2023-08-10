import { Dialog, showDialog } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper
} from '@material-ui/core';
import React from 'react';
import {
  commitButtonClass,
  commitPaperClass,
  commitRoot,
  commitVariantSelector,
  disabledStyle
} from '../style/CommitBox';
import { verticalMoreIcon } from '../style/icons';
import { rebaseActionStyle } from '../style/RebaseActionStyle';
import { CommandIDs } from '../tokens';

/**
 * RebaseAction property
 */
export interface IRebaseActionProps {
  /**
   * Whether some files are in conflict or not.
   */
  hasConflict: boolean;
  /**
   * Application command registry
   */
  commands: CommandRegistry;
  /**
   * Translation object.
   */
  trans: TranslationBundle;
}

/**
 * Component to trigger action resolving a rebase.
 *
 * @param props Component properties
 */
export function RebaseAction(props: IRebaseActionProps): JSX.Element {
  const [open, setOpen] = React.useState<boolean>(false);
  const anchor = React.useRef<HTMLDivElement>();
  const onToggle = React.useCallback(() => {
    setOpen(!open);
  }, []);
  const onClose = React.useCallback(
    (event: React.MouseEvent<Document, MouseEvent>) => {
      if (anchor.current.contains(event.target as HTMLElement)) {
        return;
      }
      setOpen(false);
    },
    []
  );
  const onContinue = React.useCallback(async () => {
    await props.commands.execute(CommandIDs.gitResolveRebase, {
      action: 'continue'
    });
  }, []);
  const onSkip = React.useCallback(async () => {
    await props.commands.execute(CommandIDs.gitResolveRebase, {
      action: 'skip'
    });
  }, []);
  const onAbort = React.useCallback(async () => {
    const answer = await showDialog({
      title: props.trans.__('Abort rebase'),
      body: props.trans.__('Are you sure you want to abort the rebase?'),
      buttons: [
        Dialog.cancelButton(),
        Dialog.warnButton({ label: props.trans.__('Abort') })
      ]
    });

    if (answer.button.accept) {
      await props.commands.execute(CommandIDs.gitResolveRebase, {
        action: 'abort'
      });
    }
  }, []);

  return (
    <div className={rebaseActionStyle}>
      <ButtonGroup ref={anchor} fullWidth={true} size="small">
        <Button
          classes={{
            root: commitButtonClass,
            disabled: disabledStyle
          }}
          disabled={props.hasConflict}
          title={props.trans.__('Continue the rebase.')}
          onClick={onContinue}
        >
          {props.trans.__('Continue')}
        </Button>
        <Button
          title={props.trans.__('Pick another rebase action.')}
          classes={{
            root: commitButtonClass
          }}
          className={commitVariantSelector}
          onClick={onToggle}
          size="small"
          aria-controls={open ? 'rebase-split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
        >
          <verticalMoreIcon.react tag="span"></verticalMoreIcon.react>
        </Button>
      </ButtonGroup>
      <Popper open={open} anchorEl={anchor.current} transition disablePortal>
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper classes={{ root: commitRoot }} className={commitPaperClass}>
              <ClickAwayListener onClickAway={onClose}>
                <MenuList id="rebase-split-button-menu">
                  <MenuItem
                    key={'skip'}
                    classes={{ root: commitRoot }}
                    onClick={onSkip}
                    title={props.trans.__('Skip the current commit.')}
                  >
                    {props.trans.__('Skip')}
                  </MenuItem>
                  <MenuItem
                    key={'abort'}
                    classes={{ root: commitRoot }}
                    onClick={onAbort}
                    title={props.trans.__('Abort the rebase.')}
                  >
                    {props.trans.__('Abort')}
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
}
