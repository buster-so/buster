import React from 'react';

import type { iconProps } from './iconProps';

function stackY3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stack y 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="9" width="14" fill="currentColor" rx="1.75" ry="1.75" x="2" y="4.5" />
        <path
          d="M4.25,3H13.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,15H4.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default stackY3;
