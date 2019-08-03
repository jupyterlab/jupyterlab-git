import { IThemeManager } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services/lib/serverconnection';
import * as d3 from 'd3-color';
import * as monaco from 'monaco-editor';
import * as React from 'react';
import { httpGitRequest } from '../../git';
import { IDiffProps } from './Diff';
import { getRefValue, IDiffContext } from './model';

/**
 * Worker implementation for the Monaco editor
 * From https://github.com/jupyterlab/jupyterlab-monaco
 */

import * as monacoCSS from 'file-loader!../../../lib/JUPYTERLAB_FILE_LOADER_jupyterlab-git-css.worker.bundle.js';
import * as monacoEditor from 'file-loader!../../../lib/JUPYTERLAB_FILE_LOADER_jupyterlab-git-editor.worker.bundle.js';
import * as monacoHTML from 'file-loader!../../../lib/JUPYTERLAB_FILE_LOADER_jupyterlab-git-html.worker.bundle.js';
import * as monacoJSON from 'file-loader!../../../lib/JUPYTERLAB_FILE_LOADER_jupyterlab-git-json.worker.bundle.js';
import * as monacoTS from 'file-loader!../../../lib/JUPYTERLAB_FILE_LOADER_jupyterlab-git-ts.worker.bundle.js';

let URLS: { [key: string]: string } = {
  css: monacoCSS,
  html: monacoHTML,
  javascript: monacoTS,
  json: monacoJSON,
  typescript: monacoTS
};

(self as any).MonacoEnvironment = {
  getWorkerUrl: function(moduleId: string, label: string): string {
    let url = URLS[label] || monacoEditor;
    return url.default;
  }
};

export interface IPlainTextDiffState {
  diffEditor: monaco.editor.IStandaloneDiffEditor;
  errorMessage: string;
}

export interface IPlainTextDiffProps {
  props: IDiffProps;
  themeManager: IThemeManager;
}

/**
 * A React component to render the diff of a plain text file
 *
 * 1. It calls the `/git/diffcontent` API on the server to get the previous and current content
 * 2. Renders the content using Monaco
 */
export class PlainTextDiff extends React.Component<
  IPlainTextDiffProps,
  IPlainTextDiffState
> {
  constructor(props: IPlainTextDiffProps) {
    super(props);
    this.state = { diffEditor: undefined, errorMessage: undefined };
    this.performDiff(props.props.diffContext);
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
    } else {
      return (
        <div style={{ height: '100%', width: '100%' }}>
          <div
            id={`monacocontainer-${this.props.props.path}-${getRefValue(
              this.props.props.diffContext.currentRef
            )}`}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      );
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
      httpGitRequest('/git/diffcontent', 'POST', {
        filename: this.props.props.path,
        prev_ref: { git: diffContext.previousRef.gitRef },
        curr_ref: currentRefValue,
        top_repo_path: this.props.props.topRepoPath
      }).then((response: Response) => {
        response
          .json()
          .then((data: any) => {
            if (response.status !== 200) {
              // Handle error
              this.setState({
                errorMessage:
                  data.message || 'Unknown error. Please check the server log.'
              });
            } else {
              this.addMonacoEditor(data['prev_content'], data['curr_content']);
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

  // -----------------------------------------------------------------------------
  // Monaco
  // -----------------------------------------------------------------------------

  /**
   * Maps path to language's Monaco specific mime type
   *
   * @param path the path of the file
   */
  private getLanguage(path: string): string {
    let extname = PathExt.extname(path).toLocaleLowerCase();
    const langs = monaco.languages.getLanguages();
    for (let i = 0; i < langs.length; ++i) {
      let lang = langs[i];
      if (lang['extensions'].indexOf(extname) !== -1) {
        if (lang['mimetypes'] !== undefined && lang['mimetypes'].length > 0) {
          return lang['mimetypes'][0];
        } else {
          return lang['id'];
        }
      }
    }
    return 'text/plain';
  }

  /**
   * Returns the HEX code of a given CSS variable for Monaco consumption
   *
   * @param varname the name of the CSS variable
   */
  private getVariableHex(varname: string): string {
    return d3
      .color(
        getComputedStyle(document.body)
          .getPropertyValue(varname)
          .trim()
      )
      .hex();
  }

  /**
   * Returns the HEX code of a given CSS variable for Monaco consumption
   */
  private updateTheme() {
    let isLight: boolean = this.props.themeManager.isLight(
      this.props.themeManager.theme
    );
    monaco.editor.defineTheme('PlainDiffComponent', {
      base: isLight ? 'vs' : 'vs-dark',
      inherit: true,
      colors: {
        'editor.background': this.getVariableHex('--jp-layout-color1'),
        'editor.lineHighlightBorder': this.getVariableHex('--jp-layout-color1'),
        'editorLineNumber.foreground': this.getVariableHex(
          '--jp-ui-font-color2'
        ),
        'editorGutter.background': this.getVariableHex('--jp-layout-color1'),
        'diffEditor.insertedTextBackground': '#C9F3C24D',
        'diffEditor.removedTextBackground': '#FF96964D'
      },
      rules: []
    });
  }

  /**
   * Creates and adds a Monaco editor to the DOM with given content
   *
   * @param prevContent the raw value of the previous content
   * @param currContent the raw value of the current content
   */
  private addMonacoEditor(prevContent, currContent) {
    const options: monaco.editor.IDiffEditorConstructionOptions = {
      readOnly: true,
      selectionHighlight: false,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'gutter',
      glyphMargin: false,
      renderFinalNewline: false,
      automaticLayout: true
      // renderSideBySide: false
    };
    const language = this.getLanguage(this.props.props.path);
    let baseModel = monaco.editor.createModel(prevContent, language);
    let headModel = monaco.editor.createModel(currContent, language);
    this.updateTheme();
    monaco.editor.setTheme('PlainDiffComponent');

    let diffEditor = monaco.editor.createDiffEditor(
      document.getElementById(
        `monacocontainer-${this.props.props.path}-${getRefValue(
          this.props.props.diffContext.currentRef
        )}`
      ),
      options
    );
    diffEditor.setModel({
      original: baseModel,
      modified: headModel
    });

    this.props.themeManager.themeChanged.connect(() => this.updateTheme());
    this.setState({ diffEditor: diffEditor });
  }
}

/**
 * Checks if a given path is supported language
 *
 * @param path the path of the file
 */
export function isMonacoSupported(path: string): boolean {
  let extname = PathExt.extname(path).toLocaleLowerCase();
  const langs = monaco.languages.getLanguages();
  for (let i = 0; i < langs.length; ++i) {
    let lang = langs[i];
    if (lang['extensions'].indexOf(extname) !== -1) {
      return true;
    }
  }
  return false;
}
