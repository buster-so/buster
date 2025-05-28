import React from 'react';

import type { iconProps } from './iconProps';

function textUnderline(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text underline';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.75,2.75v5.75c0,2.071-1.679,3.75-3.75,3.75h0c-2.071,0-3.75-1.679-3.75-3.75V2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          id="1739897115943-4549022_color"
          d="M2.75 15.25L15.25 15.25"
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

export default textUnderline;
