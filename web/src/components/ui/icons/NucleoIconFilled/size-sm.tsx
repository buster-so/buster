import React from 'react';

import type { iconProps } from './iconProps';

function sizeSm(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px size sm';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.25,14.5H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,13h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,8.25H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,6.5h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,2H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="4.5" width="7" fill="currentColor" rx="1.75" ry="1.75" x="9" y="11.5" />
      </g>
    </svg>
  );
}

export default sizeSm;
