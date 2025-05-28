import React from 'react';

import type { iconProps } from './iconProps';

function arrowsExpandDiagonal4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrows expand diagonal 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.5,11.25c-.192,0-.384-.073-.53-.22L.896,1.957c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l9.073,9.073c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,11.5h-3.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3v-3c0-.414.336-.75.75-.75s.75.336.75.75v3.75c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.25,5.75c-.414,0-.75-.336-.75-.75V1.25c0-.414.336-.75.75-.75h3.75c.414,0,.75.336.75.75s-.336.75-.75.75h-3v3c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowsExpandDiagonal4;
