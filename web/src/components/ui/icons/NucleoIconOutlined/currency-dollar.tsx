import React from 'react';

import type { iconProps } from './iconProps';

function currencyDollar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px currency dollar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 2.25L9 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.988,5.63c-.648-1.535-1.946-1.882-2.926-1.882-.911,0-3.306,.485-3.084,2.783,.155,1.613,1.676,2.214,3.005,2.451s3.258,.743,3.306,2.689c.039,1.645-1.439,2.768-3.227,2.768-1.707,0-2.895-.664-3.352-2.166"
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

export default currencyDollar;
