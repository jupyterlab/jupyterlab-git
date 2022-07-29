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
  existingRemoteWrapperClass,
  existingRemoteGridClass,
  actionsWrapperClass
} from '../style/AddRemoteDialog';
import { TranslationBundle } from '@jupyterlab/translation';

import { classes } from 'typestyle';
import {
  buttonClass,
  cancelButtonClass,
  closeButtonClass,
  contentWrapperClass,
  createButtonClass,
  titleClass,
  titleWrapperClass
} from '../style/NewBranchDialog';

import { trashIcon } from '../style/icons';

export interface IAddRemoteDialogueProps {
  /**
   * The application language translator.
   */
  trans: TranslationBundle;
  /**
   * Warning content.
   */
  warningContent?: string;
  /**
   * Git extension model
   */
  model: GitExtension;
  /**
   * Callback to handle the closing of dialogue
   */
  onClose: (remote?: Git.IGitRemote) => void;
}

export interface IAddRemoteDialogueState {
  /**
   * New remote name and url pair
   */
  newRemote: Git.IGitRemote;
  /**
   * List of known remotes
   */
  existingRemotes: Git.IGitRemote[] | null;
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
      existingRemotes: null
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
              placeholder={this.props.trans.__('name')}
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
              placeholder={this.props.trans.__('Remote Git repository URL')}
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

          <div className={existingRemoteWrapperClass}>
            <p>{this.props.trans.__('Existing Remotes:')}</p>

            {this.state.existingRemotes === null ? (
              <p>Loading remote repositories...</p>
            ) : this.state.existingRemotes.length > 0 ? (
              <div className={existingRemoteGridClass}>
                {this.state.existingRemotes.map((remote, index) => (
                  <>
                    <span>{remote.name}</span>
                    <span>{remote.url}</span>
                    <ActionButton
                      icon={trashIcon}
                      title={this.props.trans.__('Remove this remote')}
                      onClick={async () => {
                        await this.props.model.removeRemote(remote.name);
                        this.setState({
                          existingRemotes: this.state.existingRemotes.filter(
                            r => r.name !== remote.name
                          )
                        });
                      }}
                    />
                  </>
                ))}
              </div>
            ) : (
              <p> This repository does not have any remote. </p>
            )}
          </div>
        </div>
      </Dialog>
    );
  }
}
