import { ServerConnection } from '@jupyterlab/services';
import { Mode } from '@jupyterlab/codemirror';
import * as React from 'react';

import { httpGitRequest } from '../../git';
import { IDiffProps } from './Diff';
import { getRefValue, IDiffContext } from './model';

import { mergeView } from './mergeview';

interface ICurrentReference {
  special?: 'WORKING' | 'INDEX';
  git?: string;
}

export interface IPlainTextDiffState {
  errorMessage: string;
}

export interface IPlainTextDiffProps extends IDiffProps {}

/**
 * A React component to render the diff of a plain text file
 *
 * 1. It calls the `/git/diffcontent` API on the server to get the previous and current content
 * 2. Renders the content using CodeMirror merge addon
 */
export class PlainTextDiff extends React.Component<
  IPlainTextDiffProps,
  IPlainTextDiffState
> {
  constructor(props: IPlainTextDiffProps) {
    super(props);
    this.state = { errorMessage: null };
    this.performDiff(props.diffContext);
  }

  render() {
    if (this.state.errorMessage !== null) {
      return (
        <div>
          <span className="jp-git-diff-error">
            Failed to fetch diff with error:
            <span className="jp-git-diff-error-message">
              {this.state.errorMessage}
            </span>
          </span>
        </div>
      );
    } else {
      return (
        <div className="jp-git-diff-Widget">
          <div className="jp-git-diff-root">
            <div
              id={`diffviewer-${this.props.path}-${getRefValue(
                this.props.diffContext.currentRef
              )}`}
              className="jp-git-PlainText-diff"
            />
          </div>
        </div>
      );
    }
  }

  /**
   * Based on the Diff Context , calls the server API with the relevant parameters
   * to
   * @param diffContext the context in which to perform the diff
   */
  private async performDiff(diffContext: IDiffContext): Promise<void> {
    try {
      // Resolve what API parameter to call.
      let currentRefValue: ICurrentReference;
      if ('specialRef' in diffContext.currentRef) {
        currentRefValue = {
          special: diffContext.currentRef.specialRef
        };
      } else {
        currentRefValue = {
          git: diffContext.currentRef.gitRef
        };
      }

      try {
        const response = await httpGitRequest('/git/diffcontent', 'POST', {
          filename: this.props.path,
          prev_ref: { git: diffContext.previousRef.gitRef },
          curr_ref: currentRefValue,
          top_repo_path: this.props.topRepoPath
        });

        const data = await response.json();

        if (response.status !== 200) {
          // Handle error
          this.setState({
            errorMessage:
              data.message || 'Unknown error. Please check the server log.'
          });
        } else {
          this._addDiffViewer(data['prev_content'], data['curr_content']);
        }
      } catch (reason) {
        console.error(reason);
        // Handle error
        this.setState({
          errorMessage:
            reason.message || 'Unknown error. Please check the server log.'
        });
      }
    } catch (err) {
      console.error(err);
      throw ServerConnection.NetworkError;
    }
  }

  /**
   * Creates and adds a diff viewer to the DOM with given content
   *
   * @param prevContent the raw value of the previous content
   * @param currContent the raw value of the current content
   */
  private _addDiffViewer(prevContent: string, currContent: string) {
    const mode = Mode.findByFileName(this.props.path);

    mergeView(
      document.getElementById(
        `diffviewer-${this.props.path}-${getRefValue(
          this.props.diffContext.currentRef
        )}`
      ),
      {
        value: currContent,
        orig: prevContent,
        lineNumbers: true,
        mode: mode.mime,
        theme: 'jupyter',
        connect: 'align',
        collapseIdentical: true,
        revertButtons: false
      }
    );
  }
}

/**
 * Checks if a given path is supported language
 *
 * @param path the path of the file
 */
export function isText(path: string): boolean {
  return Mode.findByFileName(path) !== undefined;
}
