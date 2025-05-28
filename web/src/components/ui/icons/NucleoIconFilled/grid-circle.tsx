import React from 'react';

import type { iconProps } from './iconProps';

function gridCircle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px grid circle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="3" fill="currentColor" r="2.5" strokeWidth="0" />
        <circle cx="3" cy="9" fill="currentColor" r="2.5" strokeWidth="0" />
        <circle cx="3" cy="3" fill="currentColor" r="2.5" strokeWidth="0" />
        <circle cx="9" cy="9" fill="currentColor" r="2.5" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default gridCircle;
