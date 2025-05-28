import React from 'react';

import type { iconProps } from './iconProps';

function dog(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dog';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75,14.25v.75c0,.966-.784,1.75-1.75,1.75h0c-.966,0-1.75-.784-1.75-1.75v-.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.588,3.014l-.622-.494c-.69-.548-1.702-.386-2.186,.351l-1.754,2.668c-.765,1.164,.07,2.711,1.462,2.711h1.193"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.412,3.014l.622-.494c.69-.548,1.702-.386,2.186,.351l1.754,2.668c.765,1.164-.07,2.711-1.462,2.711h-1.193"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,9.595v-2.595c0-2.899-2.35-5.25-5.25-5.25S3.75,4.101,3.75,7v2.595c-.315,.474-.5,1.042-.5,1.655,0,1.657,1.343,3,3,3,1.232,0,2.288-.744,2.75-1.806,.462,1.062,1.518,1.806,2.75,1.806,1.657,0,3-1.343,3-3,0-.612-.185-1.18-.5-1.655Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 10.75L10.25 10.75 9 12.5 7.75 10.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6.5" cy="8" fill="currentColor" r="1" />
        <circle cx="11.5" cy="8" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default dog;
