import React from 'react';

import type { iconProps } from './iconProps';

function cube2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cube 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.251 7.1035L9 9 5.75 7.1035"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.001 12.782L9 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.997,2.332l-4.25,2.465c-.617.358-.997,1.017-.997,1.73v4.946c0,.713.38,1.372.997,1.73l4.25,2.465c.621.36,1.386.36,2.007,0l4.25-2.465c.617-.358.997-1.017.997-1.73v-4.946c0-.713-.38-1.372-.997-1.73l-4.25-2.465c-.621-.36-1.386-.36-2.007,0Z"
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

export default cube2;
