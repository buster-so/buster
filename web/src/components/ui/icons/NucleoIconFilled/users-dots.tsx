import React from 'react';

import type { iconProps } from './iconProps';

function usersDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,1.75c-.5,0-.965,.135-1.38,.352,.547,.745,.88,1.655,.88,2.648s-.333,1.903-.88,2.648c.415,.217,.88,.352,1.38,.352,1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
        <path d="M13,15c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
        <path d="M10,15c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
        <path
          d="M7.5,14c0-1.378,1.121-2.5,2.5-2.5,.565,0,1.081,.195,1.5,.513,.223-.169,.474-.297,.746-.384-1.143-1.786-3.094-2.879-5.246-2.879-2.369,0-4.505,1.315-5.575,3.432-.282,.557-.307,1.213-.069,1.801,.246,.607,.741,1.079,1.358,1.293,1.384,.48,2.826,.724,4.286,.724,.473,0,.943-.035,1.411-.086-.552-.459-.911-1.142-.911-1.914Z"
          fill="currentColor"
        />
        <path d="M16,15c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
        <circle cx="7" cy="4.75" fill="currentColor" r="3" />
      </g>
    </svg>
  );
}

export default usersDots;
