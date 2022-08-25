import * as React from 'react';
import ClearIcon from '@material-ui/icons/Clear';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import { TranslationBundle } from '@jupyterlab/translation';
import { showErrorMessage } from '@jupyterlab/apputils';
import { ActionButton } from './ActionButton';
import { Git } from '../tokens';
import { GitExtension } from '../model';
import { classes } from 'typestyle';
import {
  remoteDialogClass,
  remoteDialogInputClass,
  existingRemoteWrapperClass,
  existingRemoteGridClass,
  actionsWrapperClass
} from '../style/ManageRemoteDialog';
import {
  buttonClass,
  closeButtonClass,
  contentWrapperClass,
  createButtonClass,
  titleClass,
  titleWrapperClass
} from '../style/NewBranchDialog';
import { trashIcon } from '../style/icons';

export interface IManageRemoteDialogueProps {
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
  onClose: () => void;
}

export interface IManageRemoteDialogueState {
  /**
   * New remote name and url pair
   */
  newRemote: Git.IGitRemote;
  /**
   * List of known remotes
   */
  existingRemotes: Git.IGitRemote[] | null;
}

export class ManageRemoteDialogue extends React.Component<
  IManageRemoteDialogueProps,
  IManageRemoteDialogueState
> {
  constructor(props: IManageRemoteDialogueProps) {
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
    try {
      const remotes = await this.props.model.getRemotes();
      this.setState({ existingRemotes: remotes });
    } catch (err) {
      console.error(err);
    }
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
              onClick={() => this.props.onClose()}
            />
          </button>
        </div>
        <div className={contentWrapperClass}>
          <label className={remoteDialogInputClass}>
            <span>
              {this.props.trans.__(
                'Enter a new remote repository name and URL'
              )}
            </span>
            <input
              ref={node => {
                this._nameInput = node;
              }}
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
              ref={node => {
                this._urlInput = node;
              }}
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
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  this._addRemoteButton.click();
                }
              }}
            />
          </label>

          {this.props.warningContent && (
            <div className="jp-RemoteDialog-warning">
              {this.props.warningContent}
            </div>
          )}

          <DialogActions className={actionsWrapperClass}>
            <input
              ref={btn => {
                this._addRemoteButton = btn;
              }}
              className={classes(buttonClass, createButtonClass)}
              type="button"
              title={this.props.trans.__('Add Remote')}
              value={this.props.trans.__('Add')}
              onClick={async () => {
                const { name, url } = this.state.newRemote;
                try {
                  await this.props.model.addRemote(url, name);
                  this._nameInput.value = '';
                  this._urlInput.value = '';
                  this.setState(prevState => ({
                    existingRemotes: [
                      ...prevState.existingRemotes,
                      prevState.newRemote
                    ],
                    newRemote: { name: '', url: '' }
                  }));
                } catch (error) {
                  console.error(error);
                  showErrorMessage(
                    this.props.trans.__('Error when adding remote repository'),
                    error
                  );
                }
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
                  <React.Fragment key={`remote-${index}`}>
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
                  </React.Fragment>
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

  private _nameInput: HTMLInputElement;
  private _urlInput: HTMLInputElement;
  private _addRemoteButton: HTMLInputElement;
}
