import React from 'react';

import type { iconProps } from './iconProps';

function designFileEdit(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px design file edit';

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
          d="M8.45,16.25H3.75c-1.105,0-2-.895-2-2V3.75c0-1.105,.895-2,2-2h5.586c.265,0,.52,.105,.707,.293l3.914,3.914c.188,.188,.293,.442,.293,.707v2.025"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.207,16.401c.143-.049,.273-.131,.38-.238l3.303-3.303c.483-.483,.478-1.261-.005-1.745h0c-.483-.483-1.261-.489-1.745-.005l-3.303,3.303c-.107,.107-.189,.237-.238,.38l-.849,2.457,2.457-.849Z"
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

export default designFileEdit;
