import * as React from 'react';
import { shallow } from 'enzyme';
import 'jest';
import {
  Diff,
  IDiffProps,
  isDiffSupported
} from '../../src/components/diff/Diff';
import { NBDiff } from '../../src/components/diff/NbDiff';
import { PlainTextDiff } from '../../src/components/diff/PlainTextDiff';

describe('Diff', () => {
  ([
    ['/path/to/File.ipynb', NBDiff],
    ['/path/to/File.py', PlainTextDiff],
    ['/path/to/File.md', PlainTextDiff],
    ['/path/to/File.txt', PlainTextDiff],
    ['/path/to/File.json', PlainTextDiff]
  ] as Array<[string, typeof React.Component]>).forEach(
    ([filename, provider]) => {
      it(`should render ${provider} component for ${filename}`, () => {
        // Given
        const props: IDiffProps = {
          path: filename,
          topRepoPath: 'top/repo/path',
          diffContext: {
            currentRef: { specialRef: 'WORKING' },
            previousRef: { gitRef: '83baee' }
          }
        };

        // When
        const node = shallow(<Diff {...props} />);

        // Then
        expect(node.find(provider)).toHaveLength(1);
      });
    }
  );

  it('should not render anything when not supported', function() {
    // Given
    const props: IDiffProps = {
      path: '/path/to/File.unk',
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

  it('should not support non-ipynb and non text files', function() {
    expect(isDiffSupported('/path/to/script.unk')).toBeFalsy();
  });
});
