import React from 'react';

import type { iconProps } from './iconProps';

function folderOpen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px folder open';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.25,6c-.414,0-.75-.336-.75-.75v-.5c0-.689-.561-1.25-1.25-1.25h-1.886c-.228,0-.443-.104-.585-.281l-.603-.752c-.238-.296-.593-.467-.973-.467h-.953c-.414,0-.75.336-.75.75v2.5c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-2.5C1,1.509,2.009.5,3.25.5h.953c.837,0,1.619.375,2.144,1.029l.377.471h1.526c1.517,0,2.75,1.233,2.75,2.75v.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.227,5.271c-.427-.49-1.045-.771-1.695-.771H2.468c-.65,0-1.268.281-1.695.771s-.622,1.14-.534,1.783l.282,2.068c.185,1.356,1.356,2.378,2.725,2.378h5.509c1.368,0,2.54-1.022,2.725-2.379l.282-2.067c.088-.644-.107-1.294-.534-1.784Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default folderOpen;
