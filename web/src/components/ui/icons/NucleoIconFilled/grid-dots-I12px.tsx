import React from 'react';

import type { iconProps } from './iconProps';

function gridDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="3" fill="currentColor" r="1" />
        <circle cx="3" cy="3" fill="currentColor" r="1" />
        <circle cx="15" cy="3" fill="currentColor" r="1" />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
        <circle cx="3" cy="9" fill="currentColor" r="1" />
        <circle cx="15" cy="9" fill="currentColor" r="1" />
        <circle cx="9" cy="15" fill="currentColor" r="1" />
        <circle cx="3" cy="15" fill="currentColor" r="1" />
        <circle cx="15" cy="15" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default gridDots;
