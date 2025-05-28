import React from 'react';

import type { iconProps } from './iconProps';

function chartActivity3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart activity 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.25,5.75h-.5c-.828,0-1.5.672-1.5,1.5v1.875c0,.897-.728,1.625-1.625,1.625h0c-.897,0-1.625-.728-1.625-1.625V2.875c0-.897-.728-1.625-1.625-1.625h0c-.897,0-1.625.728-1.625,1.625v1.875c0,.828-.672,1.5-1.5,1.5h-.5"
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

export default chartActivity3;
