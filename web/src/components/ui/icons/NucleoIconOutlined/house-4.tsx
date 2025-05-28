import React from 'react';

import type { iconProps } from './iconProps';

function house4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.855,6.2l-5.25-3.99c-.358-.272-.853-.272-1.21,0L3.145,6.2c-.249,.189-.395,.484-.395,.797v7.254c0,1.105,.895,2,2,2h2.5v-4c0-.552,.448-1,1-1h1.5c.552,0,1,.448,1,1v4h2.5c1.105,0,2-.895,2-2V6.996c0-.313-.146-.607-.395-.797Z"
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

export default house4;
