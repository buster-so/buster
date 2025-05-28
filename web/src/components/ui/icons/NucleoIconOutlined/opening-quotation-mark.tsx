import React from 'react';

import type { iconProps } from './iconProps';

function openingQuotationMark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px opening quotation mark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,9.25H6.25c.552,0,1,.448,1,1v3c0,.552-.448,1-1,1H2.75c-.552,0-1-.448-1-1v-4c0-3.75,1.25-5.625,3.5-6.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,9.25h4.5c.552,0,1,.448,1,1v3c0,.552-.448,1-1,1h-3.5c-.552,0-1-.448-1-1v-4c0-3.75,1.25-5.625,3.5-6.5"
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

export default openingQuotationMark;
