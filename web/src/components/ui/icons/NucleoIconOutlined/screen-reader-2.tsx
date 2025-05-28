import React from 'react';

import type { iconProps } from './iconProps';

function screenReader2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px screen reader 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.25,11.75h2l3-2.25v7.5l-3-2.25h-2c-.552,0-1-.448-1-1v-1c0-.552.448-1,1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.75,10.813c.757.545,1.25,1.433,1.25,2.437s-.493,1.892-1.25,2.437"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.25,9.5h1.25l2.3994-1.7998c.0209-.0156.0446-.0266.066-.0415-.1721-1.4919-1.4282-2.6582-2.9655-2.6582-1.6543,0-3,1.3457-3,3,0,.7285.2713,1.3882.7047,1.9084.4618-.2524.9831-.4089,1.5453-.4089Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m16.2225,7.8596c-.0175-.3477-.1119-.6907-.3105-.9922-1.017-1.5439-3.262-4.1179-6.912-4.1179S3.106,5.3245,2.088,6.8674c-.45.6831-.45,1.582,0,2.2651.4855.7371,1.2715,1.698,2.3368,2.512"
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

export default screenReader2;
