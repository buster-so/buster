import React from 'react';

import type { iconProps } from './iconProps';

function heartLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8,14.75c0-1.129,.597-2.149,1.507-2.732,.121-1.96,1.753-3.518,3.743-3.518,1.122,0,2.118,.506,2.806,1.289,.424-.957,.694-2.013,.694-3.177,.01-2.528-2.042-4.597-4.586-4.612-1.195,.015-2.324,.491-3.164,1.306-.841-.815-1.972-1.291-3.179-1.306-2.529,.015-4.581,2.084-4.571,4.609,0,5.081,4.952,8.211,6.75,9.179v-1.038Z"
          fill="currentColor"
        />
        <path
          d="M15.5,13.025v-.775c0-1.241-1.01-2.25-2.25-2.25s-2.25,1.009-2.25,2.25v.775c-.846,.123-1.5,.845-1.5,1.725v1.5c0,.965,.785,1.75,1.75,1.75h4c.965,0,1.75-.785,1.75-1.75v-1.5c0-.879-.654-1.602-1.5-1.725Zm-2.25-1.525c.413,0,.75,.336,.75,.75v.75h-1.5v-.75c0-.414,.337-.75,.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default heartLock;
