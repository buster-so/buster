import React from 'react';

import type { iconProps } from './iconProps';

function incognito(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px incognito';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="5.25"
          cy="13.75"
          fill="none"
          r="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="12.75"
          cy="13.75"
          fill="none"
          r="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.883,1.75H6.117c-.498,0-.92,.366-.99,.859l-.377,2.641-3,3h14.5l-3-3-.377-2.641c-.07-.493-.492-.859-.99-.859Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 5.25L13.25 5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.58,12.842c.362-.365,.865-.592,1.42-.592,.555,0,1.058,.226,1.42,.592"
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

export default incognito;
