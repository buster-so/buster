import React from 'react';

import type { iconProps } from './iconProps';

function chartLine2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart line 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,12.25L6.646,7.354c.195-.195,.512-.195,.707,0l3.293,3.293c.195,.195,.512,.195,.707,0l4.896-4.896"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default chartLine2;
