import React from 'react';

import type { iconProps } from './iconProps';

function fire(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px fire';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.393,16.233c-3.737,.017-3.719-4.438-1.312-6.906,.294,3.453,2.607,2.126,3.399,4.152,.59,1.51-.618,2.747-2.086,2.754Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,16.25c1.932-.015,4.185-.621,5.354-2.5,1.449-2.33,.86-5.745-1.659-7.876,0,0-.716,1.521-2.164,2.219,0-5.094-3.281-6.844-3.281-6.844-.219,5.359-3.312,5.531-3.75,9.483-.361,3.264,2.333,5.542,5.5,5.517Z"
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

export default fire;
