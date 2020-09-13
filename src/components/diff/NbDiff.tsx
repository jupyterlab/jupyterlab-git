import { PathExt } from '@jupyterlab/coreutils';
import * as nbformat from '@jupyterlab/nbformat';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IDiffEntry } from 'nbdime/lib/diff/diffentries';
import { CellDiffModel, NotebookDiffModel } from 'nbdime/lib/diff/model';
import { CellDiffWidget } from 'nbdime/lib/diff/widget';
import * as React from 'react';
import { RefObject } from 'react';
import { requestAPI } from '../../git';
import { IDiffProps, RenderMimeConsumer } from './Diff';
import { IDiffContext } from './model';
import { NBDiffHeader } from './NBDiffHeader';

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
export class CellDiff extends React.Component<ICellDiffProps> {
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
  }

  componentDidMount() {
    this.performDiff(this.props.diffContext);
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
   * Based on the Diff Context , calls the server API with the revant parameters
   * to
   * @param diffContext the context in which to perform the diff
   */
  private performDiff(diffContext: IDiffContext): void {
    // Resolve what API parameter to call.
    let currentRefValue: any;
    if ('specialRef' in diffContext.currentRef) {
      currentRefValue = {
        special: diffContext.currentRef.specialRef
      };
    } else {
      currentRefValue = {
        git: diffContext.currentRef.gitRef
      };
    }

    requestAPI<INbdimeDiff>(
      'gitdiff',
      'POST',
      {
        file_path: PathExt.join(this.props.topRepoPath, this.props.path),
        ref_local: { git: diffContext.previousRef.gitRef },
        ref_remote: currentRefValue
      },
      'nbdime/api'
    )
      .then((data: INbdimeDiff) => {
        const base = data.base;
        const diff = data.diff;
        const nbdModel = new NotebookDiffModel(base, diff);
        this.setState({
          nbdModel: nbdModel
        });
      })
      .catch(reason => {
        // Handle error
        this.setState({
          errorMessage:
            reason.message || 'Unknown error. Please check the server log.'
        });
      });
  }
}
