import React from 'react';

import type { iconProps } from './iconProps';

function gamepadButtons(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gamepad buttons';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75,2.25h2.5c.552,0,1,.448,1,1v1.336c0,.265-.105,.52-.293,.707l-1.604,1.604c-.195,.195-.512,.195-.707,0l-1.604-1.604c-.188-.188-.293-.442-.293-.707v-1.336c0-.552,.448-1,1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,7.75v2.5c0,.552-.448,1-1,1h-1.336c-.265,0-.52-.105-.707-.293l-1.604-1.604c-.195-.195-.195-.512,0-.707l1.604-1.604c.188-.188,.442-.293,.707-.293h1.336c.552,0,1,.448,1,1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,15.75h-2.5c-.552,0-1-.448-1-1v-1.336c0-.265,.105-.52,.293-.707l1.604-1.604c.195-.195,.512-.195,.707,0l1.604,1.604c.188,.188,.293,.442,.293,.707v1.336c0,.552-.448,1-1,1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25,10.25v-2.5c0-.552,.448-1,1-1h1.336c.265,0,.52,.105,.707,.293l1.604,1.604c.195,.195,.195,.512,0,.707l-1.604,1.604c-.188,.188-.442,.293-.707,.293h-1.336c-.552,0-1-.448-1-1Z"
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

export default gamepadButtons;
