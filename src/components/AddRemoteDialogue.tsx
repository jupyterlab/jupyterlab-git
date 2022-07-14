import * as React from 'react';
import { ActionButton } from './ActionButton';
import ClearIcon from '@material-ui/icons/Clear';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import { Git } from '../tokens';
import { GitExtension } from '../model';
import {
  remoteDialogClass,
  remoteDialogInputClass,
  existingRemoteListClass,
  existingRemoteItemClass
} from '../style/AddRemoteDialog';
import { TranslationBundle } from '@jupyterlab/translation';

import { classes } from 'typestyle';
import {
  actionsWrapperClass,
  buttonClass,
  cancelButtonClass,
  closeButtonClass,
  contentWrapperClass,
  createButtonClass,
  titleClass,
  titleWrapperClass
} from '../style/NewBranchDialog';

import { deletionsMadeIcon } from '../style/icons';

export interface IAddRemoteDialogueProps {
  /**
   * The application language translator.
   */
  trans: TranslationBundle;
  warningContent?: string;
  model: GitExtension;
  onClose: (remote?: Git.IGitRemote) => void;
}

export interface IAddRemoteDialogueState {
  newRemote: Git.IGitRemote;
  existingRemotes: Git.IGitRemote[];
}

export class AddRemoteDialogue extends React.Component<
  IAddRemoteDialogueProps,
  IAddRemoteDialogueState
> {
  constructor(props: IAddRemoteDialogueProps) {
    super(props);
    this.state = {
      newRemote: {
        name: '',
        url: ''
      },
      existingRemotes: []
    };
  }

  async componentDidMount(): Promise<void> {
    const remotes = await this.props.model.getRemotes();
    this.setState({ existingRemotes: remotes });
  }

  render(): JSX.Element {
    return (
      <Dialog
        classes={{
          paper: remoteDialogClass
        }}
        open={true}
        onClose={this.props.onClose}
      >
        <div className={titleWrapperClass}>
          <p className={titleClass}>{this.props.trans.__('Manage Remotes')}</p>
          <button className={closeButtonClass}>
            <ClearIcon
              titleAccess={this.props.trans.__('Close this dialog')}
              fontSize="small"
              onClick={() => {
                this.props.onClose();
              }}
            />
          </button>
        </div>
        <div className={contentWrapperClass}>
          <label className={remoteDialogInputClass}>
            <span>
              {this.props.trans.__(
                'Enter a new remote repository name and url'
              )}
            </span>
            <input
              type="text"
              placeholder="name"
              onChange={event =>
                this.setState({
                  newRemote: {
                    ...this.state.newRemote,
                    name: event.target.value
                  }
                })
              }
            />
            <input
              type="text"
              placeholder="Remote Git repository URL"
              onChange={event =>
                this.setState({
                  newRemote: {
                    ...this.state.newRemote,
                    url: event.target.value
                  }
                })
              }
            />
          </label>

          {this.props.warningContent && (
            <div className="jp-RemoteDialog-warning">
              {this.props.warningContent}
            </div>
          )}

          {this.state.existingRemotes.length > 0 && (
            <ul className={existingRemoteListClass}>
              <p>Existing Remotes:</p>
              {this.state.existingRemotes.map((remote, index) => (
                <li key={`remote-${index}`} className={existingRemoteItemClass}>
                  <span>{remote.name}</span>
                  <span>{remote.url}</span>
                  <ActionButton
                    // className={hiddenButtonStyle}
                    icon={deletionsMadeIcon}
                    title={this.props.trans.__('Remove this remote')}
                    onClick={() => {
                      console.log('I am clicked');
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogActions className={actionsWrapperClass}>
          <input
            className={classes(buttonClass, cancelButtonClass)}
            type="button"
            title={this.props.trans.__(
              'Close this dialog without adding a remote repo'
            )}
            value={this.props.trans.__('Cancel')}
            onClick={() => {
              this.props.onClose();
            }}
          />
          <input
            className={classes(buttonClass, createButtonClass)}
            type="button"
            title={this.props.trans.__('Add Remote')}
            value={this.props.trans.__('Add')}
            onClick={() => {
              this.props.onClose(this.state.newRemote);
            }}
            disabled={!this.state.newRemote.name || !this.state.newRemote.url}
          />
        </DialogActions>
      </Dialog>
    );
  }
}
