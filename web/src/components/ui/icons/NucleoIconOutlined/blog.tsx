import React from 'react';

import type { iconProps } from './iconProps';

function blog(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px blog';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.25,12.25v2c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V3.75c0-1.105,.895-2,2-2H12.25c1.105,0,2,.895,2,2v1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 5.75L9.25 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 8.75L7 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 11.75L6.25 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.375,10.625c.444-.444,2.948-2.948,4.216-4.216,.483-.483,.478-1.261-.005-1.745h0c-.483-.483-1.261-.489-1.745-.005-1.268,1.268-3.772,3.772-4.216,4.216-.625,.625-1.125,2.875-1.125,2.875,0,0,2.25-.5,2.875-1.125Z"
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

export default blog;
