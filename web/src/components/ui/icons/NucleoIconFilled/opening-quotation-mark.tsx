import React from 'react';

import type { iconProps } from './iconProps';

function openingQuotationMark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px opening quotation mark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.25,15H2.75c-.965,0-1.75-.785-1.75-1.75v-4c0-3.856,1.264-6.144,3.978-7.199,.385-.15,.82,.042,.971,.427,.15,.386-.042,.821-.427,.971-1.317,.512-2.816,1.556-3.003,5.051h3.731c.965,0,1.75,.785,1.75,1.75v3c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,15h-3.5c-.965,0-1.75-.785-1.75-1.75v-4c0-3.856,1.264-6.144,3.978-7.199,.387-.15,.82,.042,.971,.427,.15,.386-.042,.821-.427,.971-1.317,.512-2.816,1.556-3.003,5.051h3.731c.965,0,1.75,.785,1.75,1.75v3c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default openingQuotationMark;
