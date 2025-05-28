import React from 'react';

import type { iconProps } from './iconProps';

function hand2Ban(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand 2 ban';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75,7.75V2.5c0-.69-.564-1.25-1.25-1.25s-1.25,.56-1.25,1.25V7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25,7.75V3.75c0-.69-.564-1.25-1.25-1.25s-1.25,.56-1.25,1.25V7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.751,8.525v-3.275c0-.69-.564-1.25-1.25-1.25s-1.25,.56-1.25,1.25v2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25,7.75V3.75c0-.69-.564-1.25-1.25-1.25s-1.25,.56-1.25,1.25v7.465l-1.768-2.252c-.426-.543-1.215-.635-1.755-.211-.54,.424-.604,1.131-.211,1.755l1.96,3.014c1.051,1.616,2.812,2.613,4.725,2.71"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.702 16.298L16.292 11.708"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14"
          cy="14"
          fill="none"
          r="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default hand2Ban;
