import { Mode } from '@jupyterlab/codemirror';
import * as React from 'react';
import { requestAPI } from '../../git';
import { Git } from '../../tokens';
import { IDiffProps } from './Diff';
import { mergeView } from './mergeview';
import { IDiffContext } from './model';

interface ICurrentReference {
  special?: 'WORKING' | 'INDEX';
  git?: string;
}

export interface IPlainTextDiffState {
  errorMessage: string;
}

/**
 * A React component to render the diff of a plain text file
 *
 * 1. It calls the `diffcontent` API on the server to get the previous and current content
 * 2. Renders the content using CodeMirror merge addon
 */
export class PlainTextDiff extends React.Component<
  IDiffProps,
  IPlainTextDiffState
> {
  constructor(props: IDiffProps) {
    super(props);
    this.state = { errorMessage: null };
    this._mergeViewRef = React.createRef<HTMLDivElement>();
  }

  componentDidMount() {
    this._performDiff(this.props.diffContext);
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
            <div ref={this._mergeViewRef} className="jp-git-PlainText-diff" />
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
  private _performDiff(diffContext: IDiffContext): void {
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

    requestAPI<Git.IDiffContent>('diffcontent', 'POST', {
      filename: this.props.path,
      prev_ref: { git: diffContext.previousRef.gitRef },
      curr_ref: currentRefValue as any,
      top_repo_path: this.props.topRepoPath
    })
      .then(data => {
        this._addDiffViewer(data['prev_content'], data['curr_content']);
      })
      .catch(reason => {
        console.error(reason);
        // Handle error
        this.setState({
          errorMessage:
            reason.message || 'Unknown error. Please check the server log.'
        });
      });
  }

  /**
   * Creates and adds a diff viewer to the DOM with given content
   *
   * @param prevContent the raw value of the previous content
   * @param currContent the raw value of the current content
   */
  private _addDiffViewer(prevContent: string, currContent: string) {
    const mode =
      Mode.findByFileName(this.props.path) || Mode.findBest(this.props.path);

    mergeView(this._mergeViewRef.current, {
      value: currContent,
      orig: prevContent,
      lineNumbers: true,
      mode: mode.mime,
      theme: 'jupyter',
      connect: 'align',
      collapseIdentical: true,
      revertButtons: false
    });
  }

  private _mergeViewRef: React.RefObject<HTMLDivElement>;
}
