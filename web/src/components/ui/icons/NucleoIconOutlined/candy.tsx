import React from 'react';

import type { iconProps } from './iconProps';

function candy(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px candy';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m12.25,5.215v-3.12c0-.17.17-.297.331-.243,1.606.54,2.843,1.643,3.55,3.554.06.163-.066.344-.24.344h-3.103"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.215,12.25h-3.12c-.17,0-.297.17-.243.331.54,1.606,1.643,2.843,3.554,3.55.163.06.344-.066.344-.24v-3.103"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 13.653L7.25 4.673"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 13.115L10.75 4.348"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="8.91"
          width="9.958"
          fill="none"
          rx="4.333"
          ry="4.333"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-45.399 8.999 9)"
          x="4.021"
          y="4.545"
        />
      </g>
    </svg>
  );
}

export default candy;
