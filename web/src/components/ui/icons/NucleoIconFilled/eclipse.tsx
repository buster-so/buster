import React from 'react';

import type { iconProps } from './iconProps';

function eclipse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px eclipse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0ZM1.5,6C1.5,3.778,3.123,1.939,5.244,1.576c-1.236,1.109-1.994,2.692-1.994,4.424s.758,3.315,1.994,4.424c-2.121-.362-3.744-2.201-3.744-4.424Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default eclipse;
