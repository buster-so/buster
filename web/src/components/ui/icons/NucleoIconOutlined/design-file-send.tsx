import React from 'react';

import type { iconProps } from './iconProps';

function designFileSend(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px design file send';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="10.5" cy="8" fill="currentColor" r="2" />
        <rect height="3.5" width="3.5" fill="currentColor" rx=".9" ry=".9" x="5" y="10" />
        <path
          d="M7.402,7.648c.124-.217,.123-.486-.003-.701l-1.33-2.28c-.251-.43-.959-.428-1.208,0l-1.33,2.279c-.126,.216-.128,.484-.003,.702,.124,.217,.357,.352,.607,.352h2.659c.25,0,.483-.135,.607-.352Z"
          fill="currentColor"
        />
        <path
          d="M11.625,16.25H3.75c-1.105,0-2-.895-2-2V3.75c0-1.105,.895-2,2-2h5.586c.265,0,.52,.105,.707,.293l3.914,3.914c.188,.188,.293,.442,.293,.707v2.086"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75 11.25L17.25 13.75 14.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17 13.75L12.25 13.75"
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

export default designFileSend;
