import React from 'react';

import type { iconProps } from './iconProps';

function audioDescription(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px audio description';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m14.25,2.25H3.75c-1.105,0-2,.896-2,2v7c0,1.104.895,2,2,2h2v3l3.75-3h4.75c1.105,0,2-.896,2-2v-7c0-1.104-.895-2-2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m12,10.25h-1.75v-5h1.75c.966,0,1.75.784,1.75,1.75v1.5c0,.966-.784,1.75-1.75,1.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.777 9.25L7.723 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.187,10.25l-1.3341-4.6029c-.0412-.1392-.1265-.3971-.3294-.3971h-.5471c-.2029,0-.2912.2559-.3294.3971l-1.3341,4.6029"
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

export default audioDescription;
