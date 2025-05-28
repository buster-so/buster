import React from 'react';

import type { iconProps } from './iconProps';

function gridSystem(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid system';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,15H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h14.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,11.5h-5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7.5,11.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,8h-2.812c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.812c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.438,8h-2.875c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.875c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M4.562,8H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.812c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M3,4.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7.25,4.5h-1.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,4.5h-1.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12,4.5h-1.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default gridSystem;
