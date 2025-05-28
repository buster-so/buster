import React from 'react';

import type { iconProps } from './iconProps';

function copies(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px copies';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="9" width="14" fill="currentColor" rx="1.75" ry="1.75" x="2" y="7" />
        <path
          d="M3.25,6.5c.414,0,.75-.336,.75-.75,0-.138,.112-.25,.25-.25H13.75c.138,0,.25,.112,.25,.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-.965-.785-1.75-1.75-1.75H4.25c-.965,0-1.75,.785-1.75,1.75,0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M3.75,3.5c.414,0,.75-.336,.75-.75,0-.138,.112-.25,.25-.25H13.25c.138,0,.25,.112,.25,.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-.965-.785-1.75-1.75-1.75H4.75c-.965,0-1.75,.785-1.75,1.75,0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default copies;
