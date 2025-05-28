import React from 'react';

import type { iconProps } from './iconProps';

function arrowTriangleLineExpandDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow triangle line expand diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,6.896V3c0-.138,.112-.25,.25-.25h3.896c.223,0,.334,.269,.177,.427l-3.896,3.896c-.157,.157-.427,.046-.427-.177Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.125 5.125L7.25 7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.104,15.25h3.896c.138,0,.25-.112,.25-.25v-3.896c0-.223-.269-.334-.427-.177l-3.896,3.896c-.157,.157-.046,.427,.177,.427Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.875 12.875L10.75 10.75"
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

export default arrowTriangleLineExpandDiagonal2;
