import React from 'react';

import type { iconProps } from './iconProps';

function calendarLink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar link';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,17.5h-.5c-1.24,0-2.25-1.009-2.25-2.25v-1c0-1.241,1.01-2.25,2.25-2.25h.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-.5c-.413,0-.75,.336-.75,.75v1c0,.414,.337,.75,.75,.75h.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,17.5h-.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.5c.413,0,.75-.336,.75-.75v-1c0-.414-.337-.75-.75-.75h-.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.5c1.24,0,2.25,1.009,2.25,2.25v1c0,1.241-1.01,2.25-2.25,2.25Z"
          fill="currentColor"
        />
        <path
          d="M14.25,15.5h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-3.5c-.689,0-1.25-.561-1.25-1.25V7H15v3.301c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default calendarLink;
