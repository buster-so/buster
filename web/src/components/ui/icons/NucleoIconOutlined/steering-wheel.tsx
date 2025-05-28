import React from 'react';

import type { iconProps } from './iconProps';

function steeringWheel(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px steering wheel';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16,7.75l-4.763-.34c-.499-.7-1.312-1.16-2.237-1.16s-1.738,.46-2.237,1.16l-4.763,.34"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,16l.34-4.763c.25-.178,.468-.396,.647-.646l4.763-.34"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2,10.25l4.763,.34c.178,.25,.397,.468,.647,.646l.34,4.763"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
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
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default steeringWheel;
