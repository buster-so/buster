import React from 'react';

import type { iconProps } from './iconProps';

function openInNewWindow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px open in new window';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m14.25,17H3.75c-1.5166,0-2.75-1.2334-2.75-2.75V3.75c0-.4141.3359-.75.75-.75s.75.3359.75.75v10.5c0,.6895.5605,1.25,1.25,1.25h10.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.7803,7.7197l-2.5-2.5c-.293-.293-.7676-.293-1.0605,0s-.293.7676,0,1.0605l1.2197,1.2197h-4.6895c-.4141,0-.75.3359-.75.75s.3359.75.75.75h4.6895l-1.2197,1.2197c-.293.293-.293.7676,0,1.0605.1465.1465.3379.2197.5303.2197s.3838-.0732.5303-.2197l2.5-2.5c.293-.293.293-.7676,0-1.0605Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m14.25,1h-7.5c-1.5166,0-2.75,1.2334-2.75,2.75v1.5c0,.4141.3359.75.75.75s.75-.3359.75-.75v-1.25h10v7.25c0,.6895-.5605,1.25-1.25,1.25h-7.5c-.6895,0-1.25-.5605-1.25-1.25,0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75c0,1.5166,1.2334,2.75,2.75,2.75h7.5c1.5166,0,2.75-1.2334,2.75-2.75V3.75c0-1.5166-1.2334-2.75-2.75-2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default openInNewWindow;
