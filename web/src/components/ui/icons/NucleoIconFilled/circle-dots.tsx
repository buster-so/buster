import React from 'react';

import type { iconProps } from './iconProps';

function circleDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-3.5,9c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Zm3.5,0c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Zm3.5,0c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleDots;
