import React from 'react';

import type { iconProps } from './iconProps';

function handHoldingHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand holding heart';

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
          d="M10.781,6.447c.138,.071,.299,.071,.437,0,.729-.374,3.031-1.73,3.031-3.934,.004-.968-.791-1.757-1.777-1.763-.593,.007-1.144,.301-1.473,.786-.329-.484-.881-.778-1.473-.786-.985,.006-1.78,.794-1.777,1.763,0,2.205,2.303,3.56,3.031,3.934Z"
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

export default handHoldingHeart;
