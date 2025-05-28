import React from 'react';

import type { iconProps } from './iconProps';

function shapeTriangle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shape triangle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.437,12.516L11.011,3.12c-.419-.727-1.171-1.161-2.011-1.161s-1.592,.434-2.011,1.161L1.563,12.516c-.42,.728-.42,1.596,0,2.323s1.172,1.161,2.011,1.161H14.425c.839,0,1.591-.434,2.011-1.161s.42-1.595,0-2.323Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shapeTriangle;
