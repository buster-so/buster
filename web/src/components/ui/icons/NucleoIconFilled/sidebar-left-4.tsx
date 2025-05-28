import React from 'react';

import type { iconProps } from './iconProps';

function sidebarLeft4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sidebar left 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM5.75,12.5h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm0-2.75h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm0-2.75h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm9.75,6.25c0,.689-.561,1.25-1.25,1.25h-5.25V3.5h5.25c.689,0,1.25,.561,1.25,1.25V13.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sidebarLeft4;
