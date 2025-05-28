import React from 'react';

import type { iconProps } from './iconProps';

function positionTopLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px position top left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="7" width="7" fill="currentColor" rx="1.75" ry="1.75" x="2" y="2" />
        <circle cx="15.25" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="9" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="15.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default positionTopLeft;
