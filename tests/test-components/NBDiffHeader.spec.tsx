import * as React from 'react';
import { shallow } from 'enzyme';
import 'jest';
import {
  INBDiffHeaderProps,
  NBDiffHeader
} from '../../src/components/diff/NBDiffHeader';

describe('NBDiffHeader', () => {
  it('should render the Working Tree ref correctly', function() {
    // Given
    const props: INBDiffHeaderProps = {
      path: '/path/to/File.ipynb',
      diffContext: {
        currentRef: { specialRef: 'WORKING' },
        previousRef: { gitRef: '83baee' }
      }
    };

    // When
    const node = shallow(<NBDiffHeader {...props} />);

    // Then
    expect(node.find('.jp-git-diff-header-path').text()).toContain(
      '/path/to/File.ipynb'
    );
    expect(node.find('.jp-Diff-removedchunk').text()).toContain('83baee');
    expect(node.find('.jp-Diff-addedchunk').text()).toContain('Changed');
  });

  it('should render the Index ref correctly', function() {
    // Given
    const props: INBDiffHeaderProps = {
      path: '/path/to/File.py',
      diffContext: {
        currentRef: { specialRef: 'INDEX' },
        previousRef: { gitRef: '83baee' }
      }
    };

    // When
    const node = shallow(<NBDiffHeader {...props} />);

    // Then
    expect(node.find('.jp-git-diff-header-path').text()).toContain(
      '/path/to/File.py'
    );
    expect(node.find('.jp-Diff-removedchunk').text()).toContain('83baee');
    expect(node.find('.jp-Diff-addedchunk').text()).toContain('Staged');
  });

  it('should render regular Git refs correctly', function() {
    // Given
    const props: INBDiffHeaderProps = {
      path: '/path/to/File.py',
      diffContext: {
        currentRef: { gitRef: '92carr' },
        previousRef: { gitRef: '83baee' }
      }
    };

    // When
    const node = shallow(<NBDiffHeader {...props} />);

    // Then
    expect(node.find('.jp-git-diff-header-path').text()).toContain(
      '/path/to/File.py'
    );
    expect(node.find('.jp-Diff-removedchunk').text()).toContain('83baee');
    expect(node.find('.jp-Diff-addedchunk').text()).toContain('92carr');
  });
});
