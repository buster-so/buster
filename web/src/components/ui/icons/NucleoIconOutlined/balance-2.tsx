import React from 'react';

import type { iconProps } from './iconProps';

function balance2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px balance 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75 7.75L16.25 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.514,10.53l-2.817,4.878c-.216,.374,.054,.841,.486,.841h5.633c.432,0,.702-.467,.486-.841l-2.817-4.878c-.216-.374-.755-.374-.971,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="3.5"
          cy="3.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14.5"
          cy="3.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default balance2;
