import React from 'react';

import type { iconProps } from './iconProps';

function flipHorizontal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flip horizontal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="9" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="9" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="9" cy="15.25" fill="currentColor" r=".75" />
        <path
          d="M2.583,5.496l3.5,3.132c.222,.199,.222,.546,0,.745l-3.5,3.132c-.322,.288-.833,.06-.833-.373V5.868c0-.432,.511-.661,.833-.373Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.417,5.496l-3.5,3.132c-.222,.199-.222,.546,0,.745l3.5,3.132c.322,.288,.833,.06,.833-.373V5.868c0-.432-.511-.661-.833-.373Z"
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

export default flipHorizontal;
