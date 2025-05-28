import React from 'react';

import type { iconProps } from './iconProps';

function gridCircle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid circle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5" cy="5" fill="currentColor" r="3.25" />
        <circle cx="13" cy="5" fill="currentColor" r="3.25" />
        <circle cx="5" cy="13" fill="currentColor" r="3.25" />
        <circle cx="13" cy="13" fill="currentColor" r="3.25" />
      </g>
    </svg>
  );
}

export default gridCircle;
