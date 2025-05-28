import React from 'react';

import type { iconProps } from './iconProps';

function wallet3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wallet 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,8.25h-1.5c0-.689-.561-1.25-1.25-1.25H3.75c-.689,0-1.25,.561-1.25,1.25H1c0-1.517,1.233-2.75,2.75-2.75H14.25c1.517,0,2.75,1.233,2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2.5H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.25c0-1.517-1.233-2.75-2.75-2.75ZM3.75,4H14.25c.689,0,1.25,.561,1.25,1.25v3.25h-2.75c-.965,0-1.75,.785-1.75,1.75v.5c0,.138-.112,.25-.25,.25h-3.5c-.138,0-.25-.112-.25-.25v-.5c0-.965-.785-1.75-1.75-1.75H2.5v-3.25c0-.689,.561-1.25,1.25-1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default wallet3;
