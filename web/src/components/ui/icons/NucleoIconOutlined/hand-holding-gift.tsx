import React from 'react';

import type { iconProps } from './iconProps';

function handHoldingGift(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand holding gift';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.437,12.965l4.817-2.174c.712-.321,1.549-.005,1.871,.707h0c.321,.712,.005,1.549-.707,1.871l-6.791,3.065c-.676,.305-1.441,.349-2.148,.123l-4.478-1.432"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.245,12.098l1.971,.894c.711,.323,1.549,.008,1.872-.703h0c.323-.711,.008-1.549-.703-1.872l-2.777-1.268c-2.296-1.023-4.233,.539-4.608,2.352"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M.75,9.75h1.25c.552,0,1,.448,1,1v5c0,.552-.448,1-1,1H.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.556,1.139c-.859,0-1.556,.697-1.556,1.556s.697,1.556,1.556,1.556h2.444s-.18-3.111-2.444-3.111Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11,4.25h2.444c.859,0,1.556-.697,1.556-1.556,0-.859-.697-1.556-1.556-1.556-2.264,0-2.444,3.111-2.444,3.111Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 6.354L6.75 5.302"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 5.25L15.25 8.21"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11 5.25L11 7.949"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 4.25H16.25V5.25H5.75z"
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

export default handHoldingGift;
