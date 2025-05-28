import React from 'react';

import type { iconProps } from './iconProps';

function caretMaximize(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret maximize';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.604,2.75h3.396c.138,0,.25,.112,.25,.25v3.396c0,.223-.269,.334-.427,.177l-3.396-3.396c-.157-.157-.046-.427,.177-.427Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.396,15.25H3c-.138,0-.25-.112-.25-.25v-3.396c0-.223,.269-.334,.427-.177l3.396,3.396c.157,.157,.046,.427-.177,.427Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,6.396V3c0-.138,.112-.25,.25-.25h3.396c.223,0,.334,.269,.177,.427l-3.396,3.396c-.157,.157-.427,.046-.427-.177Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,11.604v3.396c0,.138-.112,.25-.25,.25h-3.396c-.223,0-.334-.269-.177-.427l3.396-3.396c.157-.157,.427-.046,.427,.177Z"
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

export default caretMaximize;
