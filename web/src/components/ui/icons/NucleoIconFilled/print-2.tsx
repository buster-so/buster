import React from 'react';

import type { iconProps } from './iconProps';

function print2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px print 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.5,5.25h-1.5V2.75c0-.138-.112-.25-.25-.25H6.25c-.138,0-.25,.112-.25,.25v2.5h-1.5V2.75c0-.965,.785-1.75,1.75-1.75h5.5c.965,0,1.75,.785,1.75,1.75v2.5Z"
          fill="currentColor"
        />
        <path
          d="M13.75,4.5H4.25c-1.517,0-2.75,1.233-2.75,2.75v4c0,1.517,1.233,2.75,2.75,2.75h.25v1.25c0,.965,.785,1.75,1.75,1.75h5.5c.965,0,1.75-.785,1.75-1.75v-1.25h.25c1.517,0,2.75-1.233,2.75-2.75V7.25c0-1.517-1.233-2.75-2.75-2.75Zm-1.75,10.75c0,.138-.112,.25-.25,.25H6.25c-.138,0-.25-.112-.25-.25v-5.75h6v5.75Z"
          fill="currentColor"
        />
        <path
          d="M10.25,14.5h-2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.25,12h-2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default print2;
