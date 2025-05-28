import React from 'react';

import type { iconProps } from './iconProps';

function flipVertical2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flip vertical 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,7.25V2.543c0-.276,.224-.5,.5-.5,.075,0,.149,.017,.216,.049L14.256,6.774c.24,.115,.158,.476-.108,.476H3.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,10.75v4.707c0,.276,.224,.5,.5,.5,.075,0,.149-.017,.216-.049l9.79-4.682c.24-.115,.158-.476-.108-.476H3.75Z"
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

export default flipVertical2;
