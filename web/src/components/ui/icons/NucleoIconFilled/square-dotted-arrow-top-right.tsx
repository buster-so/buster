import React from 'react';

import type { iconProps } from './iconProps';

function squareDottedArrowTopRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square dotted arrow top right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="9" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="12.125" fill="currentColor" r=".75" />
        <path
          d="M15.78,2.22c-.293-.293-.768-.293-1.061,0l-4.72,4.72V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6c0,.414,.336,.75,.75,.75h6c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-4.189L15.78,3.28c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareDottedArrowTopRight;
