import React from 'react';

import type { iconProps } from './iconProps';

function makeupCream(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px makeup cream';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,11.5c0,1.243,2.351,2.25,5.25,2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.234,7.228c1.227,.412,2.016,1.053,2.016,1.772,0,1.243-2.351,2.25-5.25,2.25s-5.25-1.007-5.25-2.25c0-.724,.798-1.368,2.038-1.78"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,9v5c0,1.243,2.351,2.25,5.25,2.25s5.25-1.007,5.25-2.25v-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.014,8.25c.149-.207,.249-.454,.25-.701,0-.775-.613-1.403-1.368-1.403h-1.539c-.811,0-1.511-.582-1.676-1.396-.46,.03-.896,.219-1.238,.535-.841,.776-.935,2.103-.178,2.965"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,10.667c.926-.947,1.5-2.238,1.5-3.667,0-2.899-2.351-5.25-5.25-5.25-1.334,0-2.539,.509-3.461,1.332"
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

export default makeupCream;
