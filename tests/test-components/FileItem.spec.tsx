import { FileItem, IFileItemProps } from '../../src/components/FileItem';
import * as React from 'react';
import 'jest';
import { shallow } from 'enzyme';

describe('FileItem', () => {
  const props: IFileItemProps = {
    file: {
      x: '',
      y: '',
      to: 'some/file/path/file-name',
      from: ''
    },
    stage: '',
    model: null,
    moveFile: () => Promise.resolve(),
    discardFile: () => Promise.resolve(),
    moveFileIconClass: 'string',
    moveFileIconSelectedClass: 'string',
    moveFileTitle: '',
    contextMenu: () => {},
    selectedFile: 0,
    updateSelectedFile: () => {},
    fileIndex: 0,
    selectedStage: '',
    selectedDiscardFile: 0,
    updateSelectedDiscardFile: () => {},
    disableFile: false,
    toggleDisableFiles: () => {},
    renderMime: null
  };

  describe('#render()', () => {
    const component = shallow(<FileItem {...props} />);
    it('should display the full path on hover', () => {
      expect(component.find('[title="some/file/path/file-name"]')).toHaveLength(
        1
      );
    });
  });
});
