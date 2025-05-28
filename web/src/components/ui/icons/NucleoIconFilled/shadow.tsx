import React from 'react';

import type { iconProps } from './iconProps';

function shadow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shadow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.142,11.982c-1.046,1.088-2.513,1.768-4.142,1.768s-3.096-.68-4.142-1.768c-1.658,.438-2.858,1.182-2.858,2.268,0,1.89,3.628,2.75,7,2.75s7-.86,7-2.75c0-1.085-1.2-1.83-2.858-2.268Z"
          fill="currentColor"
        />
        <path
          d="M9,14.5c-3.584,0-6.5-2.916-6.5-6.5S5.416,1.5,9,1.5s6.5,2.916,6.5,6.5-2.916,6.5-6.5,6.5Zm0-11.5c-2.757,0-5,2.243-5,5s2.243,5,5,5,5-2.243,5-5-2.243-5-5-5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shadow;
