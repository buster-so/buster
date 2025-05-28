import React from 'react';

import type { iconProps } from './iconProps';

function widthMax(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px width max';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.5,4.255V1.255c0-.414.336-.75.75-.75s.75.336.75.75v3c0,.414-.336.75-.75.75s-.75-.336-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.5,1.255v3c0,.414-.336.75-.75.75S0,4.669,0,4.255V1.255c0-.414.336-.75.75-.75s.75.336.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.479,3.965l.46-.46h-3.689c-.414,0-.75-.336-.75-.75,0-.414.336-.75.75-.75h3.669s-.439-.438-.439-.438c-.293-.292-.294-.767,0-1.061.293-.293.768-.293,1.061,0l1.73,1.729c.141.141.22.331.22.53s-.079.39-.22.53l-1.73,1.73c-.293.293-.768.293-1.061,0-.146-.146-.22-.338-.22-.53,0-.192.073-.384.22-.53Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m0,7.755v2.5c0,.965.785,1.75,1.75,1.75h.75v-2.25c0-.414.336-.75.75-.75s.75.336.75.75v2.25h1.25v-1.25c0-.414.336-.75.75-.75s.75.336.75.75v1.25h1.25v-2.25c0-.414.336-.75.75-.75s.75.336.75.75v2.25h.75c.965,0,1.75-.785,1.75-1.75v-2.5c0-.965-.785-1.75-1.75-1.75H1.75c-.965,0-1.75.785-1.75,1.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default widthMax;
