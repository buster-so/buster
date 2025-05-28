import React from 'react';

import type { iconProps } from './iconProps';

function cookie(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cookie';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.75,8c-1.91,0-3.469-1.433-3.703-3.28-.099,.01-.195,.03-.297,.03-1.618,0-2.928-1.283-2.989-2.887-3.413,.589-6.011,3.556-6.011,7.137,0,4.004,3.246,7.25,7.25,7.25s7.25-3.246,7.25-7.25c0-.434-.045-.857-.118-1.271-.428,.17-.893,.271-1.382,.271Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12.25" cy="1.75" fill="currentColor" r=".75" />
        <circle cx="14.75" cy="4.25" fill="currentColor" r=".75" />
        <circle cx="11.25" cy="11.75" fill="currentColor" r=".75" />
        <circle cx="7" cy="7" fill="currentColor" r="1" />
        <circle cx="7.25" cy="11.25" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default cookie;
