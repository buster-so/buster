import React from 'react';

import type { iconProps } from './iconProps';

function msgDotted(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px msg dotted';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m4.987,2.961c.778-.518,1.662-.89,2.612-1.075"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.879,7.631c.185-.968.562-1.867,1.091-2.657"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.401,1.886c.95.185,1.834.557,2.612,1.075"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.03,4.974c.529.79.906,1.689,1.091,2.657"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.401,16.114c.95-.185,1.834-.557,2.612-1.075"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.03,13.026c.529-.79.906-1.689,1.091-2.657"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.879,10.369c.1538.8048.4404,1.562.8367,2.2484.4296.8061-.0451,2.712-.9657,3.6326,1.25.0676,2.8907-.493,3.6261-.9693.6791.3927,1.4279.6785,2.2229.8333"
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

export default msgDotted;
