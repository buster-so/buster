import React from 'react';

import type { iconProps } from './iconProps';

function layers(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layers';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.58,6.149L8.385,1.949c.367-.266,.864-.266,1.231,0l5.805,4.2c.579,.419,.579,1.282,0,1.701l-5.805,4.2c-.367,.266-.864,.266-1.231,0L2.58,7.851c-.579-.419-.579-1.282,0-1.701Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.746,10.533c.217,.439,.109,1.003-.326,1.317l-5.805,4.2c-.184,.133-.4,.199-.615,.199-.216,0-.432-.066-.615-.199L2.58,11.851c-.434-.314-.543-.878-.326-1.317"
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

export default layers;
