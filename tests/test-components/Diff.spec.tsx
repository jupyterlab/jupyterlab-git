import * as React from 'react';
import { shallow } from 'enzyme';
import 'jest';
import {
  Diff,
  IDiffProps,
  isDiffSupported
} from '../../src/components/diff/Diff';
import { NBDiff } from '../../src/components/diff/NbDiff';

describe('Diff', () => {
  it('should render diff provider component when supported', function() {
    // Given
    const props: IDiffProps = {
      path: '/path/to/File.ipynb',
      topRepoPath: 'top/repo/path',
      diffContext: {
        currentRef: { specialRef: 'WORKING' },
        previousRef: { gitRef: '83baee' }
      }
    };

    // When
    const node = shallow(<Diff {...props} />);

    // Then
    expect(node.find(NBDiff)).toHaveLength(1);
  });

  it('should not render anything when not supported', function() {
    // Given
    const props: IDiffProps = {
      path: '/path/to/File.py',
      topRepoPath: 'top/repo/path',
      diffContext: {
        currentRef: { specialRef: 'WORKING' },
        previousRef: { gitRef: '83baee' }
      }
    };

    // When
    const node = shallow(<Diff {...props} />);

    // Then
    expect(node.html()).toBe(null);
  });

  it('should not support non-ipynb files', function() {
    expect(isDiffSupported('/path/to/script.py')).toBeFalsy();
  });
});
