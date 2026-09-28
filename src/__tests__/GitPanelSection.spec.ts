import { Widget } from '@lumino/widgets';
import 'jest';
import type { IGitPanelProps } from '../components/GitPanel';
import { GitPanelSection } from '../widgets/GitPanelSection';

jest.mock('../components/GitPanel', () => {
  const React = require('react');
  return {
    GitPanel: (props: IGitPanelProps) =>
      React.createElement('div', null, props.contentMode)
  };
});

function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve));
}

describe('GitPanelSection', () => {
  let props: IGitPanelProps;
  let section: GitPanelSection;

  beforeEach(() => {
    props = {
      contentMode: 'history',
      model: { refresh: jest.fn().mockResolvedValue(undefined) }
    } as unknown as IGitPanelProps;
    section = new GitPanelSection(props);
  });

  afterEach(() => {
    section.dispose();
  });

  it('loads the panel the first time it is displayed', async () => {
    section.hide();
    Widget.attach(section, document.body);
    await flush();
    expect(section.widgets).toHaveLength(0);
    expect(props.model.refresh).not.toHaveBeenCalled();

    section.show();
    await flush();
    expect(section.widgets).toHaveLength(1);
    expect(props.model.refresh).toHaveBeenCalledTimes(1);

    section.hide();
    section.show();
    await flush();
    expect(section.widgets).toHaveLength(1);
    expect(props.model.refresh).toHaveBeenCalledTimes(2);
  });

  it('loads the panel when attached to a displayed panel', async () => {
    Widget.attach(section, document.body);
    await flush();

    expect(section.widgets).toHaveLength(1);
    expect(props.model.refresh).toHaveBeenCalledTimes(1);
  });
});
