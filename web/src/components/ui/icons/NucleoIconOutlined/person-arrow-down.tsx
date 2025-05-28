import React from 'react';

import type { iconProps } from './iconProps';

function personArrowDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person arrow down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="5.75"
          cy="2.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.345,11.26l-1.165-3.688c-.115-.365-.424-.63-.802-.69-.474-.075-1.022-.129-1.628-.129-.458,0-1.009,.03-1.626,.128-.374,.059-.687,.319-.802,.68-.271,.857-.795,2.517-1.17,3.704-.085,.268,.068,.548,.338,.626l1.258,.359,.202,4.05c.027,.532,.466,.95,.999,.95h1.598c.533,0,.972-.418,.999-.95l.202-4.05,1.256-.359c.271-.077,.424-.363,.339-.631Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 5L14.25 13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.5 10.75L14.25 13 12 10.75"
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

export default personArrowDown;
