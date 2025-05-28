import React from 'react';

import type { iconProps } from './iconProps';

function gripDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grip dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="6.75" fill="currentColor" r="1.25" />
        <circle cx="14.25" cy="6.75" fill="currentColor" r="1.25" />
        <circle cx="3.75" cy="6.75" fill="currentColor" r="1.25" />
        <circle cx="9" cy="11.25" fill="currentColor" r="1.25" />
        <circle cx="14.25" cy="11.25" fill="currentColor" r="1.25" />
        <circle cx="3.75" cy="11.25" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default gripDots;
