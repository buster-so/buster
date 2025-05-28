import React from 'react';

import type { iconProps } from './iconProps';

function routeOpen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px route open';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,9.75h-2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M3.25,9.75H1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H3.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,2.5c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5-2.916-6.5-6.5-6.5Zm3.098,4.749l-3.397,4.417c-.132,.171-.331,.277-.546,.292-.017,0-.033,.001-.049,.001-.198,0-.389-.079-.53-.22l-1.609-1.609c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.005,1.005,2.877-3.74c.252-.329,.724-.389,1.051-.138,.329,.253,.39,.724,.137,1.052Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default routeOpen;
