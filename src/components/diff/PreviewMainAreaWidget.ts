import { MainAreaWidget } from '@jupyterlab/apputils/lib/mainareawidget';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';

export class PreviewMainAreaWidget<
  T extends Widget = Widget
> extends MainAreaWidget {
  /**
   * Handle on the preview widget
   */
  static previewWidget: PreviewMainAreaWidget | null = null;

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
