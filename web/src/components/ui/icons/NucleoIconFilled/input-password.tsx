import React from 'react';

import type { iconProps } from './iconProps';

function inputPassword(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px input password';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.75,12.5H3.75c-.689,0-1.25-.561-1.25-1.25V6.75c0-.689,.561-1.25,1.25-1.25H14.25c.689,0,1.25,.561,1.25,1.25v.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.25c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,1.517,1.233,2.75,2.75,2.75H7.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16,11.525v-1.275c0-1.241-1.01-2.25-2.25-2.25s-2.25,1.009-2.25,2.25v1.275c-.846,.123-1.5,.845-1.5,1.725v2c0,.965,.785,1.75,1.75,1.75h4c.965,0,1.75-.785,1.75-1.75v-2c0-.879-.654-1.602-1.5-1.725Zm-2.25-2.025c.413,0,.75,.336,.75,.75v1.25h-1.5v-1.25c0-.414,.337-.75,.75-.75Z"
          fill="currentColor"
        />
        <circle cx="5.5" cy="9" fill="currentColor" r="1" />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default inputPassword;
