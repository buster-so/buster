import React from 'react';

import type { iconProps } from './iconProps';

function suitcaseLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,14.75c0-1.129,.597-2.149,1.507-2.732,.121-1.96,1.753-3.518,3.743-3.518,1.092,0,2.064,.479,2.75,1.225v-2.975c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h5.25v-1.25Z"
          fill="currentColor"
        />
        <path
          d="M16.5,13.025v-.775c0-1.241-1.01-2.25-2.25-2.25s-2.25,1.009-2.25,2.25v.775c-.846,.123-1.5,.845-1.5,1.725v1.5c0,.965,.785,1.75,1.75,1.75h4c.965,0,1.75-.785,1.75-1.75v-1.5c0-.879-.654-1.602-1.5-1.725Zm-2.25-1.525c.413,0,.75,.336,.75,.75v.75h-1.5v-.75c0-.414,.337-.75,.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcaseLock;
