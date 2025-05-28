import React from 'react';

import type { iconProps } from './iconProps';

function label3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75,3.75h7.773c.302,0,.587,.136,.777,.371l3.95,4.879-3.95,4.879c-.19,.235-.475,.371-.777,.371H4.75c-1.105,0-2-.895-2-2V5.75c0-1.105,.895-2,2-2Z"
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

export default label3;
