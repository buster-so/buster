import React from 'react';

import type { iconProps } from './iconProps';

function tableRows2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table rows 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M1 7H17V11H1z" fill="currentColor" />
        <path
          d="M17,5.5v-.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17Z"
          fill="currentColor"
        />
        <path
          d="M1,12.5v.75c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-.75H1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableRows2;
