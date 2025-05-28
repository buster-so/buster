import React from 'react';

import type { iconProps } from './iconProps';

function cloudNodes(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud nodes';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 10.25L9 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.56,13.69l1.397-1.397c.188-.188,.293-.442,.293-.707v-1.336"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.44,13.69l-1.397-1.397c-.188-.188-.293-.442-.293-.707v-1.336"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75,5.25c-.276,0-.538,.056-.786,.138-.185-2.037-1.878-3.638-3.964-3.638s-3.778,1.602-3.964,3.638c-.249-.083-.51-.138-.786-.138-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5H13.75c1.381,0,2.5-1.119,2.5-2.5s-1.119-2.5-2.5-2.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="15.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="3.5"
          cy="14.75"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14.5"
          cy="14.75"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default cloudNodes;
