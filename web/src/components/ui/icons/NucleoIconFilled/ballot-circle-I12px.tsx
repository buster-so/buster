import React from 'react';

import type { iconProps } from './iconProps';

function ballotCircle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ballot circle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.5,6h4.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-4.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,12h-4.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <circle cx="5" cy="5" fill="currentColor" r="3" />
        <circle cx="5" cy="13" fill="currentColor" r="3" />
      </g>
    </svg>
  );
}

export default ballotCircle;
