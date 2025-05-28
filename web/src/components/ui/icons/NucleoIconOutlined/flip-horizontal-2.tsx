import React from 'react';

import type { iconProps } from './iconProps';

function flipHorizontal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flip horizontal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.25,14.25H2.543c-.276,0-.5-.224-.5-.5,0-.075,.017-.149,.049-.216L6.774,3.744c.115-.24,.476-.158,.476,.108V14.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,14.25h4.707c.276,0,.5-.224,.5-.5,0-.075-.017-.149-.049-.216L11.226,3.744c-.115-.24-.476-.158-.476,.108V14.25Z"
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

export default flipHorizontal2;
