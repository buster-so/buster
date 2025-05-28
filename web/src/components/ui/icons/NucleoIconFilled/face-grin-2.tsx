import React from 'react';

import type { iconProps } from './iconProps';

function faceGrin2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face grin 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-3,9c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,2c-.828,0-1.5-.672-1.5-1.5,0-.276,.224-.5,.5-.5h2c.276,0,.5,.224,.5,.5,0,.828-.672,1.5-1.5,1.5Zm3-2c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceGrin2;
