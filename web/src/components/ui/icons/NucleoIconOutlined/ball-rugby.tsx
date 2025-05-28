import React from 'react';

import type { iconProps } from './iconProps';

function ballRugby(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ball rugby';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.251 8.084L8.45 10.283"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.084 6.251L10.283 8.45"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.434,10.466c.455-.659,1.055-1.421,1.833-2.199,.566-.566,1.294-1.208,2.199-1.833"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.262,10.567c1.192,.338,2.317,.977,3.256,1.915s1.577,2.063,1.915,3.256"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.567,2.262c.338,1.192,.977,2.317,1.915,3.256s2.063,1.577,3.256,1.915"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.82,4.82c-2.616,2.616-3.232,6.468-1.862,9.674,.104,.244,.304,.444,.548,.548,3.206,1.37,7.058,.754,9.674-1.862s3.232-6.468,1.862-9.674c-.104-.244-.304-.444-.548-.548-3.206-1.37-7.058-.754-9.674,1.862Z"
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

export default ballRugby;
