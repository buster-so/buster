import React from 'react';

import type { iconProps } from './iconProps';

function circleSortArrows(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle sort arrows';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.544,5.032l-1.695,1.978c-.334,.389-.057,.991,.456,.991h3.39c.513,0,.789-.601,.456-.991l-1.695-1.978c-.24-.279-.672-.279-.911,0Z"
          fill="currentColor"
        />
        <path
          d="M8.544,12.968l-1.695-1.978c-.334-.389-.057-.991,.456-.991h3.39c.513,0,.789,.601,.456,.991l-1.695,1.978c-.24,.279-.672,.279-.911,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleSortArrows;
