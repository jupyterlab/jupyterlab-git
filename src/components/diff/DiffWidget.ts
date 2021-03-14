import { MainAreaWidget } from '@jupyterlab/apputils';
import { PromiseDelegate } from '@lumino/coreutils';
import { Panel } from '@lumino/widgets';
import { Git } from '../../tokens';
import { DiffModel } from './model';

/**
 * DiffWidget properties
 */
export interface IDiffWidgetProps<T> {
  /**
   * Callback to build the diff widget
   */
  buildWidget: Git.IDiffCallback<T>;
  /**
   * Callback to get the diff model
   */
  getModel: () => Promise<DiffModel<T>>;
}

/**
 * DiffWidget
 */
export class DiffWidget<T> extends MainAreaWidget<Panel> {
  constructor(props: IDiffWidgetProps<T>) {
    const content = new Panel();
    const isLoaded = new PromiseDelegate<void>();
    super({
      content,
      reveal: isLoaded.promise
    });

    props
      .getModel()
      .then(model => {
        return props.buildWidget(model, this.toolbar);
      })
      .then(widget => {
        isLoaded.resolve();
        this.content.addWidget(widget);
      })
      .catch(reason => {
        console.error(reason);
        const msg = `Load Diff Model Error (${reason.message || reason})`;
        isLoaded.reject(msg);
      });
  }
}
