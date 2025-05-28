import React from 'react';

import type { iconProps } from './iconProps';

function cameraSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px camera sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="6" cy="6" fill="currentColor" r="2" strokeWidth="0" />
        <path
          d="m8.75,11.5H3.25c-1.517,0-2.75-1.233-2.75-2.75V3.25C.5,1.733,1.733.5,3.25.5h2.36c.414,0,.75.336.75.75s-.336.75-.75.75h-2.36c-.689,0-1.25.561-1.25,1.25v5.5c0,.689.561,1.25,1.25,1.25h5.5c.689,0,1.25-.561,1.25-1.25v-2.422c0-.414.336-.75.75-.75s.75.336.75.75v2.422c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.657,1.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263.421c-.204.068-.342.259-.342.474s.138.406.342.474l1.263.421.421,1.263c.068.204.26.342.475.342s.406-.138.475-.342l.421-1.263,1.263-.421c.204-.068.342-.259.342-.474s-.138-.406-.342-.474h0Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default cameraSparkle;
