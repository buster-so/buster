import React from 'react';

import type { iconProps } from './iconProps';

function folder2Open(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder 2 open';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5,15.5h-.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75h1.825c.809,0,1.572,.354,2.096,.97l1.3,1.53h4.279c1.517,0,2.75,1.233,2.75,2.75v1h-1.5v-1c0-.689-.561-1.25-1.25-1.25h-4.626c-.22,0-.429-.097-.571-.265l-1.524-1.795c-.238-.28-.585-.44-.953-.44h-1.825c-.689,0-1.25,.561-1.25,1.25V12.75c0,.689,.561,1.25,1.25,1.25h.75v1.5Z"
          fill="currentColor"
        />
        <path
          d="M17.329,8.382c-.43-.561-1.08-.882-1.786-.882H6.149c-1.015,0-1.908,.685-2.173,1.665l-.942,3.5c-.184,.682-.042,1.394,.387,1.954,.43,.561,1.08,.882,1.786,.882H14.217c1.241,0,2.333-.837,2.656-2.035h0s.843-3.13,.843-3.13c.184-.682,.042-1.394-.387-1.954Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default folder2Open;
