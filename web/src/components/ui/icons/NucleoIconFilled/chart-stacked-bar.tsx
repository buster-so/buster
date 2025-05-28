import React from 'react';

import type { iconProps } from './iconProps';

function chartStackedBar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart stacked bar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.25,2h-.5c-.965,0-1.75,.785-1.75,1.75V14.25c0,.965,.785,1.75,1.75,1.75h.5c.965,0,1.75-.785,1.75-1.75V3.75c0-.965-.785-1.75-1.75-1.75Zm-.5,1.5h.5c.138,0,.25,.112,.25,.25v5.25h-1V3.75c0-.138,.112-.25,.25-.25Z"
          fill="currentColor"
        />
        <path
          d="M3.75,6h-.5c-.965,0-1.75,.785-1.75,1.75v6.5c0,.965,.785,1.75,1.75,1.75h.5c.965,0,1.75-.785,1.75-1.75V7.75c0-.965-.785-1.75-1.75-1.75Zm-.5,1.5h.5c.138,0,.25,.112,.25,.25v3.25h-1v-3.25c0-.138,.112-.25,.25-.25Z"
          fill="currentColor"
        />
        <path
          d="M14.75,8h-.5c-.965,0-1.75,.785-1.75,1.75v4.5c0,.965,.785,1.75,1.75,1.75h.5c.965,0,1.75-.785,1.75-1.75v-4.5c0-.965-.785-1.75-1.75-1.75Zm-.5,1.5h.5c.138,0,.25,.112,.25,.25v2.25h-1v-2.25c0-.138,.112-.25,.25-.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartStackedBar;
