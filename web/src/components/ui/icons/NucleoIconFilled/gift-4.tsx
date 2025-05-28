import React from 'react';

import type { iconProps } from './iconProps';

function gift4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gift 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,6h-3.5c-1.378,0-2.5-1.122-2.5-2.5s1.122-2.5,2.5-2.5c3.133,0,4.183,3.895,4.226,4.061,.059,.225,.01,.464-.132,.647-.142,.184-.361,.292-.593,.292Zm-3.5-3.5c-.551,0-1,.449-1,1s.449,1,1,1h2.415c-.407-.86-1.18-2-2.415-2Z"
          fill="currentColor"
        />
        <path
          d="M12.5,6h-3.5c-.232,0-.451-.107-.593-.292-.142-.184-.191-.423-.132-.647,.043-.166,1.093-4.061,4.226-4.061,1.378,0,2.5,1.122,2.5,2.5s-1.122,2.5-2.5,2.5Zm-2.418-1.5h2.418c.551,0,1-.449,1-1s-.449-1-1-1c-1.243,0-2.014,1.14-2.418,2Z"
          fill="currentColor"
        />
        <path
          d="M15.25,4.5H2.75c-.965,0-1.75,.785-1.75,1.75s.785,1.75,1.75,1.75H15.25c.965,0,1.75-.785,1.75-1.75s-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M8.561,9.5L3.103,14.957c.17,.636,.554,1.183,1.08,1.549l7.006-7.006h-2.629Z"
          fill="currentColor"
        />
        <path d="M5.811 17L8.439 17 15 10.439 15 9.5 13.311 9.5 5.811 17z" fill="currentColor" />
        <path
          d="M10.561,17h1.689c1.519,0,2.75-1.231,2.75-2.75v-1.689l-4.439,4.439Z"
          fill="currentColor"
        />
        <path d="M6.439 9.5L3 9.5 3 12.939 6.439 9.5z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default gift4;
