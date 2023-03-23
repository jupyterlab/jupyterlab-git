declare module 'react-image-diff' {
  import React from 'react';

  export interface ReactImageDiffProps {
    after: string;
    before: string;
    height?: number;
    width?: number;
    type: 'difference' | 'fade' | 'swipe';
    value: number;
  }

  declare class ReactImageDiff extends React.Component<
    ReactImageDiffProps,
    any
  > {}

  export default ReactImageDiff;
}
