import React from 'react';

import type { iconProps } from './iconProps';

function flowerLotus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flower lotus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.806,11.781c-1.964,.213-3.056,1.469-3.056,1.469,0,0,1.305,1.5,3.625,1.5s3.625-1.5,3.625-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.757,8.327c-1.883-1.496-3.972-1.292-3.972-1.292,0,0-.249,2.492,1.744,4.486,1.994,1.994,4.471,1.729,4.471,1.729"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.194,11.781c1.964,.213,3.056,1.469,3.056,1.469,0,0-1.305,1.5-3.625,1.5s-3.625-1.5-3.625-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.243,8.327c1.883-1.496,3.972-1.292,3.972-1.292,0,0,.249,2.492-1.744,4.486-1.994,1.994-4.471,1.729-4.471,1.729"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,13.25s2.25-1.89,2.25-5.25c0-3.36-2.25-5.25-2.25-5.25,0,0-2.25,1.89-2.25,5.25s2.25,5.25,2.25,5.25Z"
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

export default flowerLotus;
