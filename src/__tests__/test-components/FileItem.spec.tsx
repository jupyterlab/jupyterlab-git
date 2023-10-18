import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import 'jest';
import * as React from 'react';
import { FileItem, IFileItemProps } from '../../components/FileItem';

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
    model: null as any,
    onDoubleClick: () => {},
    selected: false,
    setSelection: file => {},
    style: {},
    trans
  };

  describe('#render()', () => {
    it('should display the full path on hover', () => {
      render(<FileItem {...props} />);
      expect(
        screen.getAllByTitle('some/file/path/file-name • Modified')
      ).toHaveLength(1);
    });
  });
});
