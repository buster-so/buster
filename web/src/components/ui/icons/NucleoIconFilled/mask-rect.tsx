import React from 'react';

import type { iconProps } from './iconProps';

function maskRect(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mask rect';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.25,13H2.75c-.965,0-1.75-.785-1.75-1.75V6.75c0-.965,.785-1.75,1.75-1.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H2.75c-.138,0-.25,.112-.25,.25v4.5c0,.138,.112,.25,.25,.25h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.75,1h-6c-.965,0-1.75,.785-1.75,1.75V15.25c0,.965,.785,1.75,1.75,1.75h6c.965,0,1.75-.785,1.75-1.75V2.75c0-.965-.785-1.75-1.75-1.75Zm.25,14.25c0,.138-.112,.25-.25,.25h-6c-.138,0-.25-.112-.25-.25v-2.25h2.75c.965,0,1.75-.785,1.75-1.75V6.75c0-.965-.785-1.75-1.75-1.75h-2.75V2.75c0-.138,.112-.25,.25-.25h6c.138,0,.25,.112,.25,.25V15.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default maskRect;
