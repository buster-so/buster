import React from 'react';

import type { iconProps } from './iconProps';

function videoReplay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px video replay';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.157,8.879l-2.987-2.022c-.498-.337-1.17.02-1.17.621v4.044c0,.601.672.958,1.17.621l2.987-2.022c.439-.297.439-.945,0-1.242Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="M14.75 3.25L17.25 3.25 17.25 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.275,3.75H3.75c-1.105,0-2,.895-2,2v7.5c0,1.105.895,2,2,2h10.5c1.105,0,2-.895,2-2v-4.327"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m16.5,5.887c-.501.531-1.212.863-2,.863-1.519,0-2.75-1.231-2.75-2.75s1.231-2.75,2.75-2.75c1.166,0,2.162.726,2.563,1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 16.25L5.75 16.25"
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

export default videoReplay;
