import React from 'react';

import type { iconProps } from './iconProps';

function boxingGlove(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px boxing glove';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.25,13.75v1.5c0,.552-.448,1-1,1H6.75c-.552,0-1-.448-1-1v-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,5.75c0,1.105-.895,2-2,2h-3.17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.018,6.751c-.17-.294-.268-.636-.268-1.001v-.5c0-1.657,1.343-3,3-3h5.5c1.657,0,3,1.343,3,3v5.5c0,1.657-1.343,3-3,3H5.25c-1.657,0-3-1.343-3-3v-2c0-1.105,.895-2,2-2h1.75c.966,0,1.75,.784,1.75,1.75h0c0,.967-.784,1.75-1.75,1.75h-1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default boxingGlove;
