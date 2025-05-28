import React from 'react';

import type { iconProps } from './iconProps';

function augmentedReality2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px augmented reality 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.398.912l-2.55,1.479c-.37.215-.598.61-.598,1.038v2.968c0,.428.228.823.598,1.038l2.55,1.479c.372.216.832.216,1.204,0l2.55-1.479c.37-.215.598-.61.598-1.038v-2.968c0-.428-.228-.823-.598-1.038l-2.55-1.479c-.372-.216-.832-.216-1.204,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.59 2.831L9 4.913 5.41 2.831"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 9.076L9 4.913"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 16.904L9 13.654"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m16.072,10.58l-6.663,2.987c-.26.117-.558.117-.818,0l-6.664-2.987"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.948,9.5144l-1.607.7205c-.36.1621-.591.519-.591.9131v1.9551c0,.395.231.752.591.9131l6.25,2.8018c.26.1172.558.1172.818,0l6.25-2.8018c.36-.1621.591-.519.591-.9131v-1.9551c0-.395-.231-.752-.591-.9131l-1.6071-.7205"
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

export default augmentedReality2;
