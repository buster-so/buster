import React from 'react';

import type { iconProps } from './iconProps';

function flipFlops(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flip flops';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.749,12.749c0,1.104-.894,2-1.999,2.001-.857,0-1.619-.546-1.895-1.357-.489-1.28-.381-2.074-.939-3.897-.51-1.667-1.166-2.674-1.166-4.316,0-1.7,1.721-3.266,3.533-3.418,1.439-.12,2.467,.684,2.467,3.076,0,1.627-.334,1.71-.334,3.8,0,2.012,.352,2.562,.334,4.112Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5 6.282L4.859 4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.754,9c-.062-1.444,1.001-2.626,2.246-2.718,1-.073,2,.565,2.433,1.595"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.584,10.137c0-2.089-.334-2.173-.334-3.8,0-2.392,1.028-3.197,2.467-3.076,1.811,.152,3.533,1.718,3.533,3.418,0,1.642-.656,2.649-1.166,4.316-.558,1.823-.45,2.617-.939,3.897-.275,.812-1.038,1.358-1.895,1.357-1.104,0-1.999-.896-1.999-2.001-.018-1.55,.334-2.1,.334-4.112Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13 7.782L13.141 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.246,10.5c.062-1.444-1.001-2.626-2.246-2.718-1-.073-2,.565-2.433,1.595"
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

export default flipFlops;
