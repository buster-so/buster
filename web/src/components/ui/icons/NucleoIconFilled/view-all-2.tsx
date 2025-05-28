import React from 'react';

import type { iconProps } from './iconProps';

function viewAll2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px view all 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="7" width="7" fill="currentColor" rx="1.75" ry="1.75" x="3" y="2" />
        <rect height="10" width="5.5" fill="currentColor" rx="1.75" ry="1.75" x="11.5" y="4" />
        <rect height="5.5" width="9" fill="currentColor" rx="1.75" ry="1.75" x="1" y="10.5" />
      </g>
    </svg>
  );
}

export default viewAll2;
