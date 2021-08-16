import { ReactWidget, UseSignal, WidgetTracker } from '@jupyterlab/apputils';
import { FileBrowser } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
import { StylesProvider } from '@material-ui/core/styles';
import * as React from 'react';
import { Feedback } from '../components/Feedback';
import { GitPanel } from '../components/GitPanel';
import { LoggerContext } from '../logger';
import { GitExtension } from '../model';
import { gitWidgetStyle } from '../style/GitWidgetStyle';
import { ILogMessage, Level } from '../tokens';

/**
 * A class that exposes the git plugin Widget.
 */
export class GitWidget extends ReactWidget {
  constructor(
    model: GitExtension,
    settings: ISettingRegistry.ISettings,
    commands: CommandRegistry,
    browserTracker: WidgetTracker<FileBrowser>,
    trans: TranslationBundle,
    options?: Widget.IOptions
  ) {
    super(options);
    this.node.id = 'GitSession-root';
    this.addClass(gitWidgetStyle);

    this._trans = trans;
    this._commands = commands;
    this._browserTracker = browserTracker;
    this._model = model;
    this._settings = settings;

    // Add refresh standby condition if this widget is hidden
    model.refreshStandbyCondition = (): boolean =>
      !this._settings.composite['refreshIfHidden'] && this.isHidden;
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  onBeforeShow(msg: Message): void {
    // Trigger refresh when the widget is displayed
    this._model.refresh().catch(error => {
      console.error('Fail to refresh model when displaying GitWidget.', error);
    });
    super.onBeforeShow(msg);
  }

  /**
   * Render the content of this widget using the virtual DOM.
   *
   * This method will be called anytime the widget needs to be rendered, which
   * includes layout triggered rendering.
   */
  render(): JSX.Element {
    return (
      <StylesProvider injectFirst>
        <LoggerContext.Consumer>
          {logger => (
            <React.Fragment>
              <UseSignal
                signal={this._browserTracker.currentChanged}
                initialArgs={this._browserTracker.currentWidget}
              >
                {(tracker, filebrowser) => (
                  <GitPanel
                    commands={this._commands}
                    filebrowser={filebrowser.model}
                    logger={logger}
                    model={this._model}
                    settings={this._settings}
                    trans={this._trans}
                  />
                )}
              </UseSignal>
              <UseSignal
                signal={logger.signal}
                initialArgs={{ message: '', level: Level.INFO } as ILogMessage}
              >
                {(sender, log) =>
                  log?.message ? (
                    <Feedback
                      log={log}
                      settings={this._settings}
                      trans={this._trans}
                    />
                  ) : null
                }
              </UseSignal>
            </React.Fragment>
          )}
        </LoggerContext.Consumer>
      </StylesProvider>
    );
  }

  private _commands: CommandRegistry;
  private _browserTracker: WidgetTracker<FileBrowser>;
  private _model: GitExtension;
  private _settings: ISettingRegistry.ISettings;
  private _trans: TranslationBundle;
}
