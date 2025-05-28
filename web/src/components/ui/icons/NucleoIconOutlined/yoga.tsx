import React from 'react';

import type { iconProps } from './iconProps';

function yoga(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px yoga';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="2.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,6.75l-1.646,1.646c-.195,.195-.512,.195-.707,0l-1.561-1.561c-.375-.375-.884-.586-1.414-.586h-.922s-.922,0-.922,0c-.53,0-1.039,.211-1.414,.586l-1.561,1.561c-.195,.195-.512,.195-.707,0l-1.646-1.646"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,12.589c.155,.176,.25,.408,.25,.661h0c0,.552-.448,1-1,1h-2.596c-.775,0-1.404-.629-1.404-1.404h0c0-.644,.438-1.206,1.063-1.362l1.937-.484V6.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,6.5v4.5s1.937,.484,1.937,.484c.625,.156,1.063,.718,1.063,1.362h0c0,.775-.629,1.404-1.404,1.404h-.74"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25 16.75L15.75 16.75"
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

export default yoga;
