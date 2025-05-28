import React from 'react';

import type { iconProps } from './iconProps';

function doorOpen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px door open';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.75,15.5h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.138,0,.25-.112,.25-.25V4.25c0-.138-.112-.25-.25-.25h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.965,0,1.75,.785,1.75,1.75V13.75c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
        <path
          d="M9.444,.96c-.349-.232-.787-.275-1.175-.114L3.577,2.801c-.654,.272-1.077,.907-1.077,1.615V13.583c0,.708,.423,1.343,1.077,1.615l4.693,1.955c.155,.064,.318,.096,.481,.096,.243,0,.484-.071,.693-.21,.348-.232,.556-.621,.556-1.04V2c0-.419-.208-.808-.556-1.04Zm-1.944,8.54c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default doorOpen;
