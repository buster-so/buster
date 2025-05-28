import React from 'react';

import type { iconProps } from './iconProps';

function connections3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px connections 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.055 2.298H10.943999999999999V6.186999999999999H7.055z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(45 9 4.243)"
        />
        <path
          d="M2.298 7.055H6.186999999999999V10.943999999999999H2.298z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-45 4.243 9)"
        />
        <path
          d="M7.055 11.813H10.943999999999999V15.702H7.055z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-135 9 13.757)"
        />
        <path
          d="M11.813 7.055H15.702V10.943999999999999H11.813z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(135 13.757 9)"
        />
      </g>
    </svg>
  );
}

export default connections3;
