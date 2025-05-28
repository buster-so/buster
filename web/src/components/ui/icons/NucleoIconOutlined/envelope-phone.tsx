import React from 'react';

import type { iconProps } from './iconProps';

function envelopePhone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope phone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.75,5.25l6.767,3.733c.301.166.665.166.966,0l6.767-3.733"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m16.25,12.25v-7.5c0-1.1045-.8954-2-2-2H3.75c-1.1046,0-2,.8955-2,2v7.5c0,1.1045.8954,2,2,2h5.0528"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m11.4164,13.905l1.6037-1.3822c.1775-.1419.2369-.3857.1447-.5934l-.3588-.8824c-.0993-.2236-.3457-.3425-.5825-.2811l-1.1108.3649c-.2141.0703-.3647.2773-.3505.5022.1896,3.0086,2.5964,5.4154,5.6049,5.6049.2249.0142.4318-.1364.5022-.3505l.3649-1.1108c.0614-.2368-.0575-.4832-.2811-.5825l-.8824-.3588c-.2077-.0922-.4514-.0328-.5934.1447l-1.3822,1.6037"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default envelopePhone;
