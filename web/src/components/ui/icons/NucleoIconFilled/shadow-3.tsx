import React from 'react';

import type { iconProps } from './iconProps';

function shadow3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shadow 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,5.5h-2.5v5.25c0,.552-.448,1-1,1H5.5v2.5c0,.965,.785,1.75,1.75,1.75h7c.965,0,1.75-.785,1.75-1.75V7.25c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M10.75,12.5H3.75c-.965,0-1.75-.785-1.75-1.75V3.75c0-.965,.785-1.75,1.75-1.75h7c.965,0,1.75,.785,1.75,1.75v7c0,.965-.785,1.75-1.75,1.75ZM3.75,3.5c-.138,0-.25,.112-.25,.25v7c0,.138,.112,.25,.25,.25h7c.138,0,.25-.112,.25-.25V3.75c0-.138-.112-.25-.25-.25H3.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shadow3;
