import React from 'react';

import type { iconProps } from './iconProps';

function cloudUpload2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px cloud upload 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.518,2.51C7.77.985,6.228,0,4.5,0,2.019,0,0,2.019,0,4.5c0,1.245.509,2.373,1.329,3.189.099-.385.291-.741.58-1.029l2.5-2.5c.425-.425.99-.659,1.591-.659s1.166.234,1.591.659l2.5,2.5c.425.425.659.99.659,1.591,0,.016-.004.03-.004.046.758-.596,1.254-1.51,1.254-2.546,0-1.868-1.552-3.405-3.482-3.24Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.03,7.72l-2.5-2.5c-.293-.293-.768-.293-1.061,0l-2.5,2.5c-.293.293-.293.768,0,1.061s.768.293,1.061,0l1.22-1.22v3.689c0,.414.336.75.75.75s.75-.336.75-.75v-3.689l1.22,1.22c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default cloudUpload2;
