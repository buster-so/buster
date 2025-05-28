import React from 'react';

import type { iconProps } from './iconProps';

function darkMode(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dark mode';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1s8,3.589,8,8-3.589,8-8,8Zm0-14.5c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5-2.916-6.5-6.5-6.5Z"
          fill="currentColor"
        />
        <path d="M9,14V4c-2.761,0-5,2.239-5,5s2.239,5,5,5Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default darkMode;
