import React from 'react';

import type { iconProps } from './iconProps';

function constructionCrane(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px construction crane';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="2.5"
          width="4"
          fill="none"
          rx=".5"
          ry=".5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.75"
          y="10.75"
        />
        <path
          d="M13.75 10.75L13.75 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10 16.25L3 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,16.25V2.25c0-.276,.224-.5,.5-.5h2.5c.276,0,.5,.224,.5,.5v14"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,6.25h4.761c.354,0,.596-.357,.464-.686l-.6-1.5c-.076-.19-.26-.314-.464-.314h-6.661"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,3.75H2.25c-.276,0-.5,.224-.5,.5v1.5c0,.276,.224,.5,.5,.5h6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 9.25L8.25 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 12.25L8.25 12.25"
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

export default constructionCrane;
