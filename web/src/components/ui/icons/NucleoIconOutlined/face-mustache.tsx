import React from 'react';

import type { iconProps } from './iconProps';

function faceMustache(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face mustache';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="9" fill="currentColor" r="1" />
        <circle cx="12" cy="9" fill="currentColor" r="1" />
        <path
          d="M10.475,10.614c-.474-.181-1.135-.132-1.475,.454-.34-.586-1.001-.635-1.475-.454-.944,.36-1.63,1.503-2.613,1.374-.203-.027-.365,.17-.272,.352,.52,1.023,1.551,1.262,2.128,1.262,.662,0,1.631-.425,2.231-1.377,.6,.953,1.569,1.377,2.231,1.377,.577,0,1.608-.239,2.128-1.262,.093-.182-.07-.379-.272-.352-.982,.13-1.669-1.014-2.613-1.374Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceMustache;
