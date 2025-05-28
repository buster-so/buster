import React from 'react';

import type { iconProps } from './iconProps';

function bra(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bra';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.25 3L2.25 8.243"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75 3L15.75 8.243"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25,8.243c-.718,1.361-.668,3.031,.117,4.283,.065,.103,1.103,1.851,3.214,1.709s3.263-1.579,3.419-1.985v.002c-.682-1.009-1.375-1.918-2.788-2.852-1.516-1.002-3.153-1.157-3.962-1.157Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,8.243c.718,1.361,.668,3.031-.117,4.283-.065,.103-1.103,1.851-3.214,1.709s-3.263-1.579-3.419-1.985v.002c.682-1.009,1.375-1.918,2.788-2.852,1.516-1.002,3.153-1.157,3.962-1.157Z"
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

export default bra;
