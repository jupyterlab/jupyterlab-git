import { FileItem, IFileItemProps } from '../../src/components/FileItem';
import * as React from 'react';
import 'jest';
import { shallow } from 'enzyme';
import { nullTranslator } from '@jupyterlab/translation';

describe('FileItem', () => {
  const trans = nullTranslator.load('jupyterlab_git');

  const props: IFileItemProps = {
    contextMenu: () => {},
    file: {
      x: '',
      y: 'M',
      to: 'some/file/path/file-name',
      from: '',
      is_binary: null,
      status: null
    },
    model: null,
    onDoubleClick: () => {},
    selected: false,
    selectFile: () => {},
    style: {},
    trans
  };

  describe('#render()', () => {
    const component = shallow(<FileItem {...props} />);
    it('should display the full path on hover', () => {
      expect(
        component.find('[title="some/file/path/file-name • Modified"]')
      ).toHaveLength(1);
    });
  });
});
