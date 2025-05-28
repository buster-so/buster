import React from 'react';

import type { iconProps } from './iconProps';

function heartHand(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart hand';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.955,5.681c.183-.518,.295-1.075,.295-1.675,.006-1.514-1.217-2.747-2.733-2.756-.912,.012-1.76,.471-2.267,1.229-.507-.757-1.355-1.217-2.267-1.229-1.516,.009-2.739,1.242-2.733,2.756,0,2.462,1.805,4.243,3.247,5.275"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75,14.725c0-2.059-.236-3.639-1-4.223-.875-.669-3.152-.838-5.295-.232l-1.33-2.827c-.293-.626-1.037-.896-1.663-.603h0c-.625,.292-.896,1.036-.604,1.661l2.561,5.456-2.724-.501c-.587-.108-1.167,.224-1.371,.785h0c-.232,.637,.098,1.34,.736,1.569l2.616,.941"
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

export default heartHand;
