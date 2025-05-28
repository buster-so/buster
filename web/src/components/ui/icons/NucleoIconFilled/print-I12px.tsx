import React from 'react';

import type { iconProps } from './iconProps';

function print(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px print';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13,5.25h-1.5V2.75c0-.138-.112-.25-.25-.25H6.75c-.138,0-.25,.112-.25,.25v2.5h-1.5V2.75c0-.965,.785-1.75,1.75-1.75h4.5c.965,0,1.75,.785,1.75,1.75v2.5Z"
          fill="currentColor"
        />
        <path
          d="M13.75,4.5H4.25c-1.517,0-2.75,1.233-2.75,2.75v4c0,1.517,1.233,2.75,2.75,2.75h.75v1.25c0,.965,.785,1.75,1.75,1.75h4.5c.965,0,1.75-.785,1.75-1.75v-1.25h.75c1.517,0,2.75-1.233,2.75-2.75V7.25c0-1.517-1.233-2.75-2.75-2.75Zm-2.25,10.75c0,.138-.112,.25-.25,.25H6.75c-.138,0-.25-.112-.25-.25v-5.25h5v5.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default print;
