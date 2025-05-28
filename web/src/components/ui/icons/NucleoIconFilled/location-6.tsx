import React from 'react';

import type { iconProps } from './iconProps';

function location6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px location 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13,5c0-2.206-1.794-4-4-4s-4,1.794-4,4c0,1.949,1.402,3.572,3.25,3.924v4.326c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-4.326c1.848-.353,3.25-1.976,3.25-3.924Z"
          fill="currentColor"
        />
        <path
          d="M14.016,17H3.984c-.751,0-1.449-.372-1.868-.996s-.499-1.411-.215-2.106l1.023-2.5c.348-.849,1.164-1.398,2.082-1.398h1.243c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1.243c-.306,0-.578,.183-.693,.466l-1.023,2.5c-.097,.235-.07,.491,.071,.702s.369,.332,.623,.332H14.016c.254,0,.481-.121,.623-.332s.168-.467,.071-.702l-1.023-2.5c-.115-.284-.388-.466-.693-.466h-1.243c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.243c.918,0,1.734,.549,2.082,1.398l1.023,2.5c.284,.696,.204,1.483-.215,2.106s-1.117,.996-1.868,.996Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default location6;
