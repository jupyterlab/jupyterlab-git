import { TranslationBundle } from '@jupyterlab/translation';
import { checkIcon } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import * as React from 'react';
import { classes } from 'typestyle';
import { listItemIconClass } from '../style/BranchMenu';
import {
  commitButtonClass,
  commitFormClass,
  commitPaperClass,
  commitRoot,
  commitVariantSelector,
  disabledStyle
} from '../style/CommitBox';
import { verticalMoreIcon } from '../style/icons';
import {
  listItemBoldTitleClass,
  listItemContentClass,
  listItemDescClass
} from '../style/NewBranchDialog';
import { CommandIDs } from '../tokens';
import { CommitMessage } from './CommitMessage';

/**
 * Commit action
 */
interface ICommitVariant {
  /**
   * Action title
   */
  title: string;
  /**
   * Action description
   */
  description: string;
}

/**
 * Interface describing component properties.
 */
export interface ICommitBoxProps {
  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

  /**
   * Boolean indicating whether files currently exist which have changes to commit.
   */
  hasFiles: boolean;

  /**
   * Commit button label
   */
  label: string;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;

  /**
   * Commit message summary.
   */
  summary: string;

  /**
   * Commit message description.
   */
  description: string;

  /**
   * Whether commit is amending the previous one or not
   */
  amend: boolean;

  /**
   * Updates the commit message summary.
   *
   * @param summary - commit message summary
   */
  setSummary: (summary: string) => void;

  /**
   * Updates the commit message description.
   *
   * @param description - commit message description
   */
  setDescription: (description: string) => void;

  /**
   * Updates the amend checkbox state
   *
   * @param amend - amend toggle on/off
   */
  setAmend: (amend: boolean) => void;

  /**
   * Callback to invoke in order to commit changes.
   *
   * @returns a promise which commits changes
   */
  onCommit: () => Promise<void>;
}

/**
 * CommitBox state
 */
export interface ICommitBoxState {
  /**
   * Whether the commit variant menu is opened or not.
   */
  open: boolean;
}

/**
 * React component for entering a commit message.
 */
export class CommitBox extends React.Component<
  ICommitBoxProps,
  ICommitBoxState
> {
  /**
   * Returns a React component for entering a commit message.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: ICommitBoxProps) {
    super(props);
    this._options.push(
      {
        title: this.props.trans.__('Create a new commit'),
        description: this.props.trans.__(
          'New commit will be created and show up as a next one after the previous commit (default).'
        )
      },
      {
        title: this.props.trans.__('Amend previous commit'),
        description: this.props.trans.__(
          'Staged changes will be added to the previous commit and its date will be updated.'
        )
      }
    );
    this._anchorRef = React.createRef<HTMLDivElement>();

    this.state = {
      open: false
    };
  }

  componentDidMount(): void {
    this.props.commands.commandExecuted.connect(this._handleCommand);
  }

  componentWillUnmount(): void {
    this.props.commands.commandExecuted.disconnect(this._handleCommand);
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    const disabled = !this._canCommit();
    const title = !this.props.hasFiles
      ? this.props.trans.__('Disabled: No files are staged for commit')
      : !this.props.summary
      ? this.props.trans.__('Disabled: No commit message summary')
      : this.props.label;

    const shortcutHint = CommandRegistry.formatKeystroke(
      this._getSubmitKeystroke()
    );
    const summaryPlaceholder = this.props.trans.__(
      'Summary (%1 to commit)',
      shortcutHint
    );
    return (
      <div className={classes(commitFormClass, 'jp-git-CommitBox')}>
        <CommitMessage
          trans={this.props.trans}
          summary={this.props.summary}
          summaryPlaceholder={summaryPlaceholder}
          description={this.props.description}
          disabled={this.props.amend}
          setSummary={this.props.setSummary}
          setDescription={this.props.setDescription}
        />
        <ButtonGroup ref={this._anchorRef} fullWidth={true} size="small">
          <Button
            classes={{
              root: commitButtonClass,
              disabled: disabledStyle
            }}
            title={title}
            disabled={disabled}
            onClick={this.props.onCommit}
          >
            {this.props.label}
          </Button>
          <Button
            classes={{
              root: commitButtonClass
            }}
            className={commitVariantSelector}
            size="small"
            aria-controls={this.state.open ? 'split-button-menu' : undefined}
            aria-expanded={this.state.open ? 'true' : undefined}
            aria-label="select commit variant"
            aria-haspopup="menu"
            onClick={this._handleToggle}
          >
            <verticalMoreIcon.react tag="span" />
          </Button>
        </ButtonGroup>
        <Popper
          open={this.state.open}
          anchorEl={this._anchorRef.current}
          role={undefined}
          transition
          disablePortal
        >
          {({ TransitionProps }) => (
            <Grow {...TransitionProps}>
              <Paper
                classes={{ root: commitRoot }}
                className={commitPaperClass}
              >
                <ClickAwayListener onClickAway={this._handleClose}>
                  <MenuList id="split-button-menu">
                    {this._options.map((option, index) => (
                      <MenuItem
                        key={option.title}
                        classes={{ root: commitRoot }}
                        selected={this.props.amend ? index === 1 : index === 0}
                        onClick={event =>
                          this._handleMenuItemClick(event, index)
                        }
                      >
                        {(this.props.amend ? index === 1 : index === 0) ? (
                          <checkIcon.react
                            className={listItemIconClass}
                            tag="span"
                          />
                        ) : (
                          <span className={listItemIconClass} />
                        )}
                        <div className={listItemContentClass}>
                          <p className={listItemBoldTitleClass}>
                            {option.title}
                          </p>
                          <p className={listItemDescClass}>
                            {option.description}
                          </p>
                        </div>
                      </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    );
  }

  /**
   * Whether a commit can be performed (files are staged and summary is not empty).
   */
  private _canCommit(): boolean {
    if (this.props.amend) {
      return this.props.hasFiles;
    }
    return !!(this.props.hasFiles && this.props.summary);
  }

  /**
   * Get keystroke configured to act as a submit action.
   */
  private _getSubmitKeystroke = (): string => {
    const binding = this.props.commands.keyBindings.find(
      binding => binding.command === CommandIDs.gitSubmitCommand
    );
    return binding.keys.join(' ');
  };

  /**
   * Close the commit variant menu if needed.
   */
  private _handleClose = (
    event: React.MouseEvent<Document, MouseEvent>
  ): void => {
    if (
      this._anchorRef.current &&
      this._anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    this.setState({ open: false });
  };

  /**
   * Handle commit variant menu item click
   */
  private _handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ): void => {
    this.setState({
      open: false
    });
    this.props.setAmend(index === 1);
  };

  /**
   * Toggle state of the commit variant menu visibility
   */
  private _handleToggle = (): void => {
    this.setState({ open: !this.state.open });
  };

  /**
   * Callback invoked upon command execution activated when entering a commit message description.
   *
   * ## Notes
   *
   * -   Triggers the `'submit'` action on appropriate command (and if commit is possible)
   *
   */
  private _handleCommand = (
    _: CommandRegistry,
    commandArgs: CommandRegistry.ICommandExecutedArgs
  ): void => {
    if (commandArgs.id === CommandIDs.gitSubmitCommand && this._canCommit()) {
      this.props.onCommit();
    }
  };

  private _anchorRef: React.RefObject<HTMLDivElement>;
  private _options: ICommitVariant[] = [];
}
