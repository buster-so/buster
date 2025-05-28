import React from 'react';

import type { iconProps } from './iconProps';

function people3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px people 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="13.406"
          cy="2.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="4.594"
          cy="2.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.892,14.25h.764s.174,2.083,.174,2.083c.043,.518,.476,.917,.997,.917h1.16c.52,0,.953-.399,.997-.917l.174-2.083h1.593c.33,0,.57-.315,.482-.633l-1.662-6.026c-.104-.375-.408-.658-.792-.723-.398-.067-.859-.115-1.371-.115s-.972,.048-1.371,.115c-.384,.065-.689,.347-.792,.723-.316,1.144-.631,2.288-.947,3.431"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.419,13.617l-1.662-6.026c-.104-.375-.408-.658-.792-.723-.398-.067-.859-.115-1.371-.115s-.972,.048-1.371,.115c-.384,.065-.689,.347-.792,.723-.554,2.009-1.108,4.018-1.662,6.026-.088,.318,.152,.633,.482,.633h1.593s.174,2.083,.174,2.083c.043,.518,.476,.917,.997,.917h1.16c.52,0,.953-.399,.997-.917l.174-2.083h1.593c.33,0,.57-.315,.482-.633Z"
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

export default people3;
