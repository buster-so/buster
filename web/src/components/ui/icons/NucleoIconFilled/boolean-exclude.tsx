import React from 'react';

import type { iconProps } from './iconProps';

function booleanExclude(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px boolean exclude';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,6h-2.25V3.75c0-.965-.785-1.75-1.75-1.75H3.75c-.965,0-1.75,.785-1.75,1.75v6.5c0,.965,.785,1.75,1.75,1.75h2.25v2.25c0,.965,.785,1.75,1.75,1.75h6.5c.965,0,1.75-.785,1.75-1.75V7.75c0-.965-.785-1.75-1.75-1.75Zm-2.75,5.5H6.5V6.5h5v5Z"
          fill="currentColor"
        />
        <path
          d="M10.75,12.5h-3.5c-.965,0-1.75-.785-1.75-1.75v-3.5c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v3.5c0,.965-.785,1.75-1.75,1.75Zm-3.5-5.5c-.138,0-.25,.112-.25,.25v3.5c0,.138,.112,.25,.25,.25h3.5c.138,0,.25-.112,.25-.25v-3.5c0-.138-.112-.25-.25-.25h-3.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default booleanExclude;
