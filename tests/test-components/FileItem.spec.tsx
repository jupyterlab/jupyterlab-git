import { FileItem, IFileItemProps } from '../../src/components/FileItem';
import * as React from 'react';
import 'jest';
import { shallow } from 'enzyme';

describe('FileItem', () => {
  const props: IFileItemProps = {
    topRepoPath: '',
    file: {
      to: 'some/file/path/file-name'
    },
    stage: '',
    app: null,
    refresh: null,
    moveFile: () => {},
    discardFile: () => {},
    moveFileIconClass: 'string',
    moveFileIconSelectedClass: 'string',
    moveFileTitle: '',
    openFile: () => {},
    extractFilename: () => {},
    contextMenu: () => {},
    parseFileExtension: () => {},
    parseSelectedFileExtension: () => {},
    selectedFile: 0,
    updateSelectedFile: () => {},
    fileIndex: 0,
    selectedStage: '',
    selectedDiscardFile: 0,
    updateSelectedDiscardFile: () => {},
    disableFile: false,
    toggleDisableFiles: () => {},
    sideBarExpanded: false,
    renderMime: null,
    themeManager: null
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
