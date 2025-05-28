import React from 'react';

import type { iconProps } from './iconProps';

function caretMaximizeDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret maximize diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6.146,1.75H2c-.138,0-.25.112-.25.25v4.146c0,.223.269.334.427.177L6.323,2.177c.157-.157.046-.427-.177-.427Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.25,5.854v4.146c0,.138-.112.25-.25.25h-4.146c-.223,0-.334-.269-.177-.427l4.146-4.146c.157-.157.427-.046.427.177Z"
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

export default caretMaximizeDiagonal2;
