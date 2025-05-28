import React from 'react';

import type { iconProps } from './iconProps';

function notebookBookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px notebook bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m7.36,5.36l-1.36-1.36-1.36,1.36c-.236.236-.64.069-.64-.265V.75h4v4.345c0,.334-.404.501-.64.265Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="8.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 6 6)"
          x=".75"
          y="1.75"
        />
      </g>
    </svg>
  );
}

export default notebookBookmark;
