import React from 'react';

import type { iconProps } from './iconProps';

function caretMinimizeDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret minimize diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6.75,10.896v-3.896c0-.138.112-.25.25-.25h3.896c.223,0,.334.269.177.427l-3.896,3.896c-.157.157-.427.046-.427-.177Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.104,5.25h3.896c.138,0,.25-.112.25-.25V1.104c0-.223-.269-.334-.427-.177L.927,4.823c-.157.157-.046.427.177.427Z"
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

export default caretMinimizeDiagonal2;
