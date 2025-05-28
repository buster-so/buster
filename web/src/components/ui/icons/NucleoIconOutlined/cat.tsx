import React from 'react';

import type { iconProps } from './iconProps';

function cat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.25,10V2.172c0-.603,.676-.96,1.174-.619l3.576,2.447"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,10V2.172c0-.603-.676-.96-1.174-.619l-3.576,2.447"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,13.417c.434-.477,.801-.967,1-1.491-.333-.117-.667-.175-1-.175-.333,0-.667,.058-1,.175,.199,.524,.566,1.015,1,1.491h0Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.442,11.871c.2-.591,.308-1.219,.308-1.871,0-3.452-3.022-6.25-6.75-6.25-3.728,0-6.75,2.798-6.75,6.25,0,.652,.108,1.28,.308,1.871"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.655,15.748c-.815,.323-1.713,.502-2.655,.502-.943,0-1.84-.179-2.655-.502"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 11.75L0.75 12"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 13.5L1.5 15"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 11.75L17.25 12"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 13.5L16.5 15"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 13L9 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="9.5" fill="currentColor" r="1" />
        <circle cx="12" cy="9.5" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default cat;
