import React from 'react';

import type { iconProps } from './iconProps';

function caretLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.791,9.845l7.923,5.025c.666,.422,1.536-.056,1.536-.845V3.975c0-.788-.87-1.267-1.536-.845L3.791,8.155c-.619,.393-.619,1.296,0,1.689Z"
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

export default caretLeft;
