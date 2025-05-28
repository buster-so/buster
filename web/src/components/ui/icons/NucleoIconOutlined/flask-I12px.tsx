import React from 'react';

import type { iconProps } from './iconProps';

function flask(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px flask';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m4.25.75v5.25l-2.464,3.695c-.443.665.033,1.555.832,1.555h6.763c.799,0,1.275-.89.832-1.555l-2.464-3.695V.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25 0.75L8.75 0.75"
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

export default flask;
