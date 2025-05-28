import React from 'react';

import type { iconProps } from './iconProps';

function faceSmileWink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face smile wink';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25,11.758c-.472,.746-1.304,1.242-2.25,1.242s-1.778-.496-2.25-1.242"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10,9.25c.138-.105,.604-.432,1.281-.422,.639,.01,1.077,.314,1.219,.422"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="9" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default faceSmileWink;
