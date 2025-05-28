import React from 'react';

import type { iconProps } from './iconProps';

function eyelash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eyelash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.712,10.693c-.032,.15-.075,.297-.129,.44h0c.127-.336,.192-.692,.192-1.052,0-.491-.122-.975-.356-1.407"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.415,9.766c-.064,.014-.127,.026-.192,.037h0c2.028-.338,3.514-2.092,3.515-4.148"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.049,10.083h0c2.276,0,4.181-1.725,4.407-3.99"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.006,11.195c-.273,0-.546-.023-.815-.069h0c.269,.046,.542,.069,.815,.069,2.039,0,3.857-1.287,4.533-3.211"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.035,10.296c-.073,.048-.148,.092-.225,.135h0c1.389-.763,2.15-2.315,1.901-3.88"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75,11.5c-2.038,.678-4.27,.431-6.111-.675-3.082-1.848-7.047-1.206-9.389,1.52"
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

export default eyelash;
