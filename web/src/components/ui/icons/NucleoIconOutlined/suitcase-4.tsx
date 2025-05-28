import React from 'react';

import type { iconProps } from './iconProps';

function suitcase4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="9" cy="8.75" fill="currentColor" r=".75" />
        <path
          d="M15.75,11.5v1.75c0,1.105-.895,2-2,2H4.25c-1.105,0-2-.895-2-2v-1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,4.75V2.25c0-.552,.448-1,1-1h3.5c.552,0,1,.448,1,1v2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.902,9.215l-5.902,2.035-5.902-2.035c-.807-.278-1.348-1.037-1.348-1.891v-2.574h14.5v2.574c0,.853-.541,1.613-1.348,1.891Z"
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

export default suitcase4;
