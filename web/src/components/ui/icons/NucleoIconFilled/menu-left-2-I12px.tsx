import React from 'react';

import type { iconProps } from './iconProps';

function menuLeft2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px menu left 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,15H2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,4.5H2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.25,9.75H2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default menuLeft2;
