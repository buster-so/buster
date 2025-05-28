import React from 'react';

import type { iconProps } from './iconProps';

function playRotateClockwise2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px play rotate clockwise 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m15.71,6.25c-1.083-2.64-3.679-4.5-6.71-4.5-4.004,0-7.25,3.246-7.25,7.25,0,4.004,3.246,7.25,7.25,7.25s7.25-3.246,7.25-7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.768 5.843L15.712 6.25 16.12 3.305"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m11.652,8.568l-3.651-2.129c-.333-.194-.752.046-.752.432v4.259c0,.386.419.626.752.432l3.651-2.129c.331-.193.331-.671,0-.864h0Z"
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

export default playRotateClockwise2;
