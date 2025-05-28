import React from 'react';

import type { iconProps } from './iconProps';

function shieldKeyhole(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shield keyhole';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.783,2.813l-5.25-1.68c-.349-.111-.718-.111-1.066,0L3.216,2.813c-.728,.233-1.216,.903-1.216,1.667v6.52c0,3.508,4.946,5.379,6.46,5.869,.177,.057,.358,.086,.54,.086s.362-.028,.538-.085c1.516-.49,6.462-2.361,6.462-5.869V4.48c0-.764-.489-1.434-1.217-1.667Zm-5.033,7.549v2.138c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.138c-.872-.31-1.5-1.134-1.5-2.112,0-1.243,1.007-2.25,2.25-2.25s2.25,1.007,2.25,2.25c0,.978-.628,1.802-1.5,2.112Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shieldKeyhole;
