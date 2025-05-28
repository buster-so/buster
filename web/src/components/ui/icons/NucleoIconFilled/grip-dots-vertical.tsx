import React from 'react';

import type { iconProps } from './iconProps';

function gripDotsVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px grip dots vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="4" cy="6" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="8" cy="6" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="4" cy="2" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="8" cy="2" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="4" cy="10" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="8" cy="10" fill="currentColor" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default gripDotsVertical;
