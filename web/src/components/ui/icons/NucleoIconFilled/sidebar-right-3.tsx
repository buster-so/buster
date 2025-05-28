import React from 'react';

import type { iconProps } from './iconProps';

function sidebarRight3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sidebar right 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,3.5h5.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h5.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25V4.75c0-.689,.561-1.25,1.25-1.25Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2h-2.5c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75h2.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sidebarRight3;
