import { MainAreaWidget } from '@jupyterlab/apputils/lib/mainareawidget';
import { Message } from '@lumino/messaging';
import { Panel, TabBar, Widget } from '@lumino/widgets';

export class PreviewMainAreaWidget<
  T extends Widget = Widget
> extends MainAreaWidget {
  /**
   * Handle on the preview widget
   */
  protected static previewWidget: PreviewMainAreaWidget | null = null;

  constructor(options: MainAreaWidget.IOptions<T> & { isPreview?: boolean }) {
    super(options);

    if (options.isPreview ?? true) {
      PreviewMainAreaWidget.disposePreviewWidget(
        PreviewMainAreaWidget.previewWidget
      );
      PreviewMainAreaWidget.previewWidget = this;
    }
  }

  /**
   * Dispose screen as a preview screen
   */
  static disposePreviewWidget(isPreview: PreviewMainAreaWidget<Widget>): void {
    return isPreview && PreviewMainAreaWidget.previewWidget.dispose();
  }

  /**
   * Pin the preview screen if user clicks on tab title
   */
  static pinWidget(
    tabPosition: number,
    tabBar: TabBar<Widget>,
    diffWidget: PreviewMainAreaWidget<Panel>
  ): void {
    // We need to wait for the tab node to be inserted in the DOM
    setTimeout(() => {
      // Get the most recent tab opened
      const tab =
        tabPosition >= 0 ? tabBar.contentNode.children[tabPosition] : null;
      const tabTitle = tab.querySelector<HTMLElement>('.lm-TabBar-tabLabel');

      tabTitle.classList.add('jp-git-tab-mod-preview');

      const onClick = () => {
        tabTitle.classList.remove('jp-git-tab-mod-preview');
        tabTitle.removeEventListener('click', onClick, true);
        if (PreviewMainAreaWidget.previewWidget === diffWidget) {
          PreviewMainAreaWidget.previewWidget = null;
        }
      };

      tabTitle.addEventListener('click', onClick, true);
      diffWidget.disposed.connect(() => {
        tabTitle.removeEventListener('click', onClick, true);
      });
    }, 0);
  }

  /**
   * Callback just after the widget is attached to the DOM
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.node.addEventListener('click', this._onClick.bind(this), false);
  }

  /**
   * Callback just before the widget is detached from the DOM
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('click', this._onClick.bind(this), false);
    super.onBeforeAttach(msg);
  }

  /**
   * Callback on click event in capture phase
   */
  _onClick(): void {
    PreviewMainAreaWidget.previewWidget = null;
  }
}
