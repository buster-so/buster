import React from 'react';

import type { iconProps } from './iconProps';

function gridLayout6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid layout 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="10" y="10" />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="10" y="2" />
        <rect height="14" width="6" fill="currentColor" rx="1.75" ry="1.75" x="2" y="2" />
      </g>
    </svg>
  );
}

export default gridLayout6;
