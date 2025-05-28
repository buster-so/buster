import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldUpFromLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold up from line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.854,7.439L9.391,1.833c-.2-.251-.582-.251-.782,0L4.146,7.439c-.261,.328-.028,.811,.391,.811h2.213v4c0,.552,.448,1,1,1h2.5c.552,0,1-.448,1-1v-4h2.213c.419,0,.652-.484,.391-.811Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 16.25L6.75 16.25"
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

export default arrowBoldUpFromLine;
