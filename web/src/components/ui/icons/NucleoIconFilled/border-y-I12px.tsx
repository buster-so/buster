import React from 'react';

import type { iconProps } from './iconProps';

function borderY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px border y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="9" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="9" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="9" fill="currentColor" r=".75" />
        <path
          d="M15.25,2H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,14.5H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default borderY;
