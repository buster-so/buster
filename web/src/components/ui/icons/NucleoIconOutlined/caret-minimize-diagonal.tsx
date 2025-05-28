import React from 'react';

import type { iconProps } from './iconProps';

function caretMinimizeDiagonal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret minimize diagonal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.146,7.75h-4.646c-.138,0-.25-.112-.25-.25V2.854c0-.223,.269-.334,.427-.177l4.646,4.646c.157,.157,.046,.427-.177,.427Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.854,10.25H7.5c.138,0,.25,.112,.25,.25v4.646c0,.223-.269,.334-.427,.177L2.677,10.677c-.157-.157-.046-.427,.177-.427Z"
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

export default caretMinimizeDiagonal;
