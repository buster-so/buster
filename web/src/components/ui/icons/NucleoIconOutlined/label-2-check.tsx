import React from 'react';

import type { iconProps } from './iconProps';

function label2Check(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label 2 check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,9.5v-3.75c0-1.105,.895-2,2-2h7.773c.302,0,.587,.136,.777,.371l3.95,4.879-3.95,4.879c-.19,.235-.475,.371-.777,.371H7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.744 12.75L3.353 14.25 6.75 9.75"
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

export default label2Check;
