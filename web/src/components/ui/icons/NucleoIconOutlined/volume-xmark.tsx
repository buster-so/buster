import React from 'react';

import type { iconProps } from './iconProps';

function volumeXmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px volume xmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5,5.75H2.25c-.828,0-1.5,.672-1.5,1.5v3.5c0,.828,.672,1.5,1.5,1.5h2.75l5.48,3.508c.333,.213,.77-.026,.77-.421V2.664c0-.395-.437-.634-.77-.421l-5.48,3.508Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 7.25L17.25 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25 7.25L13.75 10.75"
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

export default volumeXmark;
