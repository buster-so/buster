import React from 'react';

import type { iconProps } from './iconProps';

function workflow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px workflow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="3.75" cy="4.75" fill="currentColor" r="2.75" strokeWidth="0" />
        <path
          d="m16.7803,12.7197l-2.75-2.75c-.293-.293-.7676-.293-1.0605,0s-.293.7676,0,1.0605l1.4697,1.4697h-2.1895c-.6895,0-1.25-.5605-1.25-1.25v-4.5c0-1.5166-1.2334-2.75-2.75-2.75-.4141,0-.75.3359-.75.75s.3359.75.75.75c.6895,0,1.25.5605,1.25,1.25v4.5c0,1.5166,1.2334,2.75,2.75,2.75h2.1895l-1.4697,1.4697c-.293.293-.293.7676,0,1.0605.1465.1465.3379.2197.5303.2197s.3838-.0732.5303-.2197l2.75-2.75c.293-.293.293-.7676,0-1.0605Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default workflow;
