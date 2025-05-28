import React from 'react';

import type { iconProps } from './iconProps';

function suitcasePen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25,4.75V2.25c0-.552,.448-1,1-1h3.5c.552,0,1,.448,1,1v2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,8.274v-1.524c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v6.5c0,1.104,.895,2,2,2h5.046"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.207,16.401c.143-.049,.273-.131,.38-.238l3.303-3.303c.483-.483,.478-1.261-.005-1.745h0c-.483-.483-1.261-.489-1.745-.005l-3.303,3.303c-.107,.107-.189,.237-.238,.38l-.849,2.457,2.457-.849Z"
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

export default suitcasePen;
