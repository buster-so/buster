import React from 'react';

import type { iconProps } from './iconProps';

function paragraph(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paragraph';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.067,3.317c0-1.141-.925-2.067-2.067-2.067s-2.067,.925-2.067,2.067,.517,1.55,2.067,2.583c1.359,.906,3.1,2.067,3.1,3.617,0,1.712-1.388,2.583-3.1,2.583"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.933,14.683c0,1.141,.925,2.067,2.067,2.067s2.067-.925,2.067-2.067-.707-1.677-2.067-2.583c-1.55-1.033-3.1-2.067-3.1-3.617,0-1.712,1.388-2.583,3.1-2.583"
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

export default paragraph;
