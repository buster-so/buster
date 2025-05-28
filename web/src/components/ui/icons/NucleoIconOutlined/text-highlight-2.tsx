import React from 'react';

import type { iconProps } from './iconProps';

function textHighlight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text highlight 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.527,13.723l-1.527,1.527H1.888c-.328,0-.492-.396-.26-.628l2.899-2.899"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.559 3.691L10.441 7.809"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6.659"
          width="12.725"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-45 10.056 8.195)"
          x="3.693"
          y="4.865"
        />
      </g>
    </svg>
  );
}

export default textHighlight2;
