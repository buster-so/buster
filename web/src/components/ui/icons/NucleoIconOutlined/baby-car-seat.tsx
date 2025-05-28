import React from 'react';

import type { iconProps } from './iconProps';

function babyCarSeat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baby car seat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7 10.5L13 4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.928,7.446l-.484-2.997c-.175-1.091-1.2-1.833-2.291-1.659l-.987,.158,1.552,9.62c.156,.969,.993,1.681,1.974,1.681h7.398c1.676,0,2.381-1.364,2.096-2.512-.171-.689-.735-1.252-1.424-1.424-.696-.174-1.346,.019-1.81,.422-.347,.301-.761,.514-1.22,.514h-.578"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7" cy="10.5" fill="currentColor" r="1.5" />
      </g>
    </svg>
  );
}

export default babyCarSeat;
