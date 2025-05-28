import React from 'react';

import type { iconProps } from './iconProps';

function caretDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.845,14.209l5.025-7.923c.422-.666-.056-1.536-.845-1.536H3.975c-.788,0-1.267,.87-.845,1.536l5.025,7.923c.393,.619,1.296,.619,1.689,0Z"
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

export default caretDown;
