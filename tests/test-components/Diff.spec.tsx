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
    ['/path/to/File.json', PlainTextDiff],
    ['/path/to/File.unk', PlainTextDiff] // unknown filename extension
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

  it('should support diffing all files', function() {
    expect(isDiffSupported('/path/to/script.unk')).toBeFalsy();
  });
});
