import React from 'react';

import type { iconProps } from './iconProps';

function chefHat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chef hat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75 13.75L13.25 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 12L7.75 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25 12L10.25 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.912,3.983c-.539-.23-1.145-.301-1.792-.168-1.172,.241-2.118,1.218-2.323,2.397-.329,1.894,1.12,3.538,2.953,3.538v5.5c0,.552,.448,1,1,1h6.5c.552,0,1-.448,1-1v-5.5c1.832,0,3.281-1.643,2.954-3.536-.204-1.18-1.15-2.157-2.322-2.399-.648-.134-1.254-.063-1.794,.167"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,5c0-1.795,1.455-3.25,3.25-3.25s3.25,1.455,3.25,3.25"
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

export default chefHat;
