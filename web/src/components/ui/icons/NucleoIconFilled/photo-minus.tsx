import React from 'react';

import type { iconProps } from './iconProps';

function photoMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px photo minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m16.25,11.4395l-3.0557-3.0557c-1.0723-1.0723-2.8164-1.0713-3.8887,0l-5.8359,5.8359c-.1269.1265-.1937.2915-.2094.4629.1575.0398.3197.0674.4896.0674h10.5c1.1046,0,2-.8955,2-2v-1.3105Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m14.25,15.5H3.75c-1.5166,0-2.75-1.2334-2.75-2.75v-7.5c0-1.5166,1.2334-2.75,2.75-2.75h5.5508c.4141,0,.75.3359.75.75s-.3359.75-.75.75H3.75c-.6895,0-1.25.5605-1.25,1.25v7.5c0,.6895.5605,1.25,1.25,1.25h10.5c.6895,0,1.25-.5605,1.25-1.25v-6.5c0-.4141.3359-.75.75-.75s.75.3359.75.75v6.5c0,1.5166-1.2334,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m16.75,4.5h-5c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="5.75" cy="7.25" fill="currentColor" r="1.25" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default photoMinus;
