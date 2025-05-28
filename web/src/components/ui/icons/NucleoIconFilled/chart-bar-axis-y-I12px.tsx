import React from 'react';

import type { iconProps } from './iconProps';

function chartBarAxisY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart bar axis y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,1c-.414,0-.75,.336-.75,.75v14.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V1.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="4" width="11.5" fill="currentColor" rx="1.75" ry="1.75" x="4.5" y="7" />
        <rect height="4" width="7.5" fill="currentColor" rx="1.75" ry="1.75" x="4.5" y="2" />
        <rect height="4" width="4.5" fill="currentColor" rx="1.75" ry="1.75" x="4.5" y="12" />
      </g>
    </svg>
  );
}

export default chartBarAxisY;
