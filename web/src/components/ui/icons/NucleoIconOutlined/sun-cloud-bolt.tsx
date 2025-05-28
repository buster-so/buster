import React from 'react';

import type { iconProps } from './iconProps';

function sunCloudBolt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sun cloud bolt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.251,6.826c0-.025,0-.05,0-.076,0-1.657,1.343-3,3-3s3,1.343,3,3c0,.084-.003,.168-.01,.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 0.75L11.25 1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.493 2.507L15.139 2.861"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.007 2.507L7.361 2.861"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25 6.75L16.75 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13,14.25h.75c1.381,0,2.5-1.119,2.5-2.5s-1.119-2.5-2.5-2.5c-.413,0-.797,.11-1.14,.287-.427-1.602-1.874-2.787-3.61-2.787s-3.182,1.186-3.61,2.787c-.343-.177-.727-.287-1.14-.287-1.381,0-2.5,1.119-2.5,2.5,0,1.296,.987,2.362,2.25,2.488"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.585,10.499c.239-.413,.594-.752,1.02-.972"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25 10.75L6.5 14.25 8.905 14.25 7.75 17.25 10.5 13.75 8.095 13.75 9.25 10.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default sunCloudBolt;
