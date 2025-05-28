import React from 'react';

import type { iconProps } from './iconProps';

function humidity2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px humidity 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.625,16.25c1.45,0,2.625-1.278,2.625-2.854,0-2.168-1.471-3.095-2.625-4.646-1.154,1.552-2.625,2.479-2.625,4.646,0,1.576,1.175,2.854,2.625,2.854Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2,9.75c1.521,0,2-1.5,3.5-1.5s2.021,1.5,3.5,1.5c.247,0,.467-.038,.668-.103"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2,5.75c1.521,0,2-1.5,3.5-1.5s2.021,1.5,3.5,1.5c1.542,0,2.042-1.5,3.5-1.5s2.021,1.5,3.5,1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2,13.75c1.521,0,2-1.5,3.5-1.5,1.312,0,1.875,1.148,2.986,1.436"
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

export default humidity2;
