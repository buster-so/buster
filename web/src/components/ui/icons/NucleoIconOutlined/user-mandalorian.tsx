import React from 'react';

import type { iconProps } from './iconProps';

function userMandalorian(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user mandalorian';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25 6.549L5.25 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.953,16c1.298-1.958,3.522-3.25,6.047-3.25s4.749,1.291,6.047,3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.798,2.755c-2.028,.106-3.548,1.926-3.548,3.957v1.739c0,.342,.175,.66,.463,.844l2.041,1.299c.16,.102,.347,.156,.537,.156h1.418c.19,0,.376-.054,.537-.156l2.041-1.299c.288-.184,.463-.502,.463-.844v-1.951c0-2.138-1.789-3.858-3.952-3.745Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.297,6.093c.908,.272,2.177,.542,3.703,.542,1.539,0,2.817-.275,3.727-.55"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 10.75L9 6.635"
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

export default userMandalorian;
