import React from 'react';

import type { iconProps } from './iconProps';

function label3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.883,3.648c-.334-.412-.83-.648-1.36-.648H4.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h7.773c.53,0,1.026-.236,1.36-.649l3.95-4.879c.223-.275,.223-.668,0-.943l-3.95-4.88Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default label3;
