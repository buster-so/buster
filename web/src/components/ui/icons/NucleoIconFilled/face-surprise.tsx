import React from 'react';

import type { iconProps } from './iconProps';

function faceSurprise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face surprise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-3,8c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,4.25c-.966,0-1.75-.783-1.75-1.75s.784-1.75,1.75-1.75,1.75,.783,1.75,1.75-.784,1.75-1.75,1.75Zm3-4.25c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceSurprise;
