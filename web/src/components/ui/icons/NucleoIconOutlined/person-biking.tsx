import React from 'react';

import type { iconProps } from './iconProps';

function personBiking(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person biking';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="14"
          cy="13"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="4"
          cy="13"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="10.5" cy="3.5" fill="currentColor" r="1.5" />
        <path
          d="M8.75,14.25l.452-3.164c.029-.203-.069-.403-.247-.505l-2.118-1.21c-.557-.318-.674-1.071-.241-1.544l1.239-1.351c.369-.403,.993-.435,1.402-.072l1.23,1.093c.183,.163,.419,.253,.664,.253h2.12"
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

export default personBiking;
