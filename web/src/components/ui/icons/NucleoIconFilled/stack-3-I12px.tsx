import React from 'react';

import type { iconProps } from './iconProps';

function stack3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stack 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="1em" width="15" fill="currentColor" rx="2.75" ry="2.75" x="1.5" y="2" />
        <path
          d="M13.25,15.5H4.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default stack3;
