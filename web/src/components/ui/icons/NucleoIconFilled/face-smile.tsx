import React from 'react';

import type { iconProps } from './iconProps';

function faceSmile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px face smile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0Zm-2,4c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Zm4.545,4.4c-.659.699-1.587,1.1-2.545,1.1s-1.887-.401-2.545-1.1c-.284-.301-.271-.776.031-1.06s.776-.271,1.06.031c.766.812,2.144.812,2.909,0,.284-.301.759-.315,1.06-.031s.315.759.031,1.06Zm-.545-2.4c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default faceSmile;
