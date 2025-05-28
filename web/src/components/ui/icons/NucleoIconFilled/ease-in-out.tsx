import React from 'react';

import type { iconProps } from './iconProps';

function easeInOut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ease in out';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,4c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75c-5.192,0-6.138,3.345-6.972,6.296-.822,2.908-1.471,5.204-5.528,5.204-.414,0-.75,.336-.75,.75s.336,.75,.75,.75c5.192,0,6.138-3.345,6.972-6.296,.822-2.908,1.471-5.204,5.528-5.204Z"
          fill="currentColor"
        />
        <path
          d="M3.75,5c.696,0,1.293-.411,1.575-1h3.925c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-3.925c-.282-.589-.879-1-1.575-1-.965,0-1.75,.785-1.75,1.75s.785,1.75,1.75,1.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,13c-.696,0-1.293,.411-1.575,1h-3.925c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.925c.282,.589,.879,1,1.575,1,.965,0,1.75-.785,1.75-1.75s-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default easeInOut;
