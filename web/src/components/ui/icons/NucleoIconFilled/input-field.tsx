import React from 'react';

import type { iconProps } from './iconProps';

function inputField(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px input field';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6.25,9.5h-3.5c-1.517,0-2.75-1.233-2.75-2.75v-1.5c0-1.517,1.233-2.75,2.75-2.75h3.5c.414,0,.75.336.75.75s-.336.75-.75.75h-3.5c-.689,0-1.25.561-1.25,1.25v1.5c0,.689.561,1.25,1.25,1.25h3.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.25,9.5h-.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h.5c.689,0,1.25-.561,1.25-1.25v-1.5c0-.689-.561-1.25-1.25-1.25h-.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h.5c1.517,0,2.75,1.233,2.75,2.75v1.5c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.5,10.5c-.276,0-.5-.224-.5-.5V2c0-.276.224-.5.5-.5.414,0,.75-.336.75-.75s-.336-.75-.75-.75c-.475,0-.906.173-1.25.451-.344-.278-.775-.451-1.25-.451-.414,0-.75.336-.75.75s.336.75.75.75c.276,0,.5.224.5.5v8c0,.276-.224.5-.5.5-.414,0-.75.336-.75.75s.336.75.75.75c.475,0,.906-.173,1.25-.451.344.278.775.451,1.25.451.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default inputField;
