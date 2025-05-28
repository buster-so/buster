import React from 'react';

import type { iconProps } from './iconProps';

function towel(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px towel';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,16.5H5.75c-.965,0-1.75-.785-1.75-1.75,0-.414,.336-.75,.75-.75s.75,.336,.75,.75c0,.138,.112,.25,.25,.25H14.25c.138,0,.25-.112,.25-.25V4.5c0-.551-.449-1-1-1-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c1.378,0,2.5,1.122,2.5,2.5V14.75c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
        <path
          d="M13.5,2H4.5c-1.378,0-2.5,1.122-2.5,2.5v6.75c0,.965,.785,1.75,1.75,1.75h7c.965,0,1.75-.785,1.75-1.75V4.5c0-.551,.449-1,1-1,.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default towel;
