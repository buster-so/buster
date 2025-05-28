import React from 'react';

import type { iconProps } from './iconProps';

function unorderedList2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px unordered list 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,9.75h-7.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,4.5h-7.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,15h-7.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <circle cx="3.75" cy="9" fill="currentColor" r="1.75" />
        <circle cx="3.75" cy="3.75" fill="currentColor" r="1.75" />
        <circle cx="3.75" cy="14.25" fill="currentColor" r="1.75" />
      </g>
    </svg>
  );
}

export default unorderedList2;
