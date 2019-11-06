import { nbformat } from '@jupyterlab/coreutils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ServerConnection } from '@jupyterlab/services/lib/serverconnection';
import { IDiffEntry } from 'nbdime/lib/diff/diffentries';
import { CellDiffModel, NotebookDiffModel } from 'nbdime/lib/diff/model';
import { CellDiffWidget } from 'nbdime/lib/diff/widget';
import * as React from 'react';
import { RefObject } from 'react';
import { httpGitRequest } from '../../git';
import { IDiffContext } from './model';
import { NBDiffHeader } from './NBDiffHeader';
import { IDiffProps, RenderMimeConsumer } from './Diff';

export interface ICellDiffProps {
  cellChunk: CellDiffModel[];
  mimeType: string;
}

/**
 * A React component which renders the diff is a single Notebook cell.
 *
 * This uses the NBDime PhosporJS CellDiffWidget internally. To get around the
 * PhosporJS <=> ReactJS barrier, it uses React Refs(https://reactjs.org/docs/refs-and-the-dom.html)
 *
 * During component render, a Ref is created for the ReactDOM and after the component
 * is mounted, the PhosporJS widget is created and attached to the Ref.
 */
export class CellDiff extends React.Component<ICellDiffProps, {}> {
  private unAddedOrRemovedRef: RefObject<HTMLDivElement> = React.createRef<
    HTMLDivElement
  >();
  private addedRef: RefObject<HTMLDivElement> = React.createRef<
    HTMLDivElement
  >();
  private removedRef: RefObject<HTMLDivElement> = React.createRef<
    HTMLDivElement
  >();
  private renderMimeRegistry: IRenderMimeRegistry;

  constructor(props: ICellDiffProps) {
    super(props);
    this.state = {};
  }

  componentDidMount(): void {
    const chunk = this.props.cellChunk;

    if (chunk.length === 1 && !(chunk[0].added || chunk[0].deleted)) {
      const widget = new CellDiffWidget(
        chunk[0],
        this.renderMimeRegistry,
        this.props.mimeType
      );
      this.unAddedOrRemovedRef.current.appendChild(widget.node);
    } else {
      for (let j = 0; j < chunk.length; j++) {
        const cell = chunk[j];
        const ref = cell.deleted ? this.removedRef : this.addedRef;
        const widget = new CellDiffWidget(
          cell,
          this.renderMimeRegistry,
          this.props.mimeType
        );
        ref.current.appendChild(widget.node);
      }
    }
  }

  render() {
    const chunk = this.props.cellChunk;
    return (
      <RenderMimeConsumer>
        {(value: IRenderMimeRegistry) => {
          this.renderMimeRegistry = value;
          return (
            <React.Fragment>
              {chunk.length === 1 && !(chunk[0].added || chunk[0].deleted) ? (
                <div ref={this.unAddedOrRemovedRef} />
              ) : (
                <div className={'jp-Diff-addremchunk'}>
                  <div className={'jp-Diff-addedchunk'} ref={this.addedRef} />
                  <div
                    className={'jp-Diff-removedchunk'}
                    ref={this.removedRef}
                  />
                </div>
              )}
            </React.Fragment>
          );
        }}
      </RenderMimeConsumer>
    );
  }
}

export interface INBDiffState {
  nbdModel: NotebookDiffModel;
  errorMessage: string;
}

interface INbdimeDiff {
  base?: nbformat.INotebookContent;
  diff?: IDiffEntry[];
  message?: string;
}

/**
 * A React component to render the diff of a single Notebook file.
 *
 * 1. It calls the `/nbdime/api/gitdiff` API on the server to get the diff model
 * 2. Renders the Diff header
 * 3. For each cell, invokes the CellDiff component
 */
export class NBDiff extends React.Component<IDiffProps, INBDiffState> {
  constructor(props: IDiffProps) {
    super(props);
    this.state = {
      nbdModel: undefined,
      errorMessage: undefined
    };
    this.performDiff(props.diffContext);
  }

  render() {
    if (this.state.errorMessage !== undefined) {
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
    } else if (this.state.nbdModel !== undefined) {
      const cellComponents = this.state.nbdModel.chunkedCells.map(
        (cellChunk, index) => (
          <CellDiff
            key={index}
            cellChunk={cellChunk}
            mimeType={this.state.nbdModel.mimetype}
          />
        )
      );
      return (
        <div className="jp-git-diff-Widget">
          <div className="jp-git-diff-root jp-mod-hideunchanged">
            <div className="jp-git-Notebook-diff">
              <NBDiffHeader {...this.props} />
              {cellComponents}
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  /**
   * Based on the Diff Context , calls the server API with the revant paremeters
   * to
   * @param diffContext the context in which to perform the diff
   */
  private performDiff(diffContext: IDiffContext): void {
    try {
      // Resolve what API parameter to call.
      let currentRefValue;
      if ('specialRef' in diffContext.currentRef) {
        currentRefValue = {
          special: diffContext.currentRef.specialRef
        };
      } else {
        currentRefValue = {
          git: diffContext.currentRef.gitRef
        };
      }

      httpGitRequest('/nbdime/api/gitdiff', 'POST', {
        file_path: this.props.path,
        ref_local: { git: diffContext.previousRef.gitRef },
        ref_remote: currentRefValue
      }).then((response: Response) => {
        response
          .json()
          .then((data: INbdimeDiff) => {
            if (response.status !== 200) {
              // Handle error
              this.setState({
                errorMessage:
                  data.message || 'Unknown error. Please check the server log.'
              });
            } else {
              // Handle response
              let base = data.base;
              let diff = data.diff;
              let nbdModel = new NotebookDiffModel(base, diff);
              this.setState({
                nbdModel: nbdModel
              });
            }
          })
          .catch(reason => {
            // Handle error
            this.setState({
              errorMessage:
                reason.message || 'Unknown error. Please check the server log.'
            });
          });
      });
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }
}
