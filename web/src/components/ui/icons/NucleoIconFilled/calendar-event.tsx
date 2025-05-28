import React from 'react';

import type { iconProps } from './iconProps';

function calendarEvent(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar event';

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
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.75c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm0,12.5H4.25c-.689,0-1.25-.561-1.25-1.25V7H15v6.25c0,.689-.561,1.25-1.25,1.25Z"
          fill="currentColor"
        />
        <path
          d="M11.25,12.5c-.965,0-1.75-.785-1.75-1.75s.785-1.75,1.75-1.75,1.75,.785,1.75,1.75-.785,1.75-1.75,1.75Zm0-2c-.138,0-.25,.112-.25,.25,0,.275,.5,.275,.5,0,0-.138-.112-.25-.25-.25Z"
          fill="currentColor"
        />
        <circle cx="11.25" cy="10.75" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default calendarEvent;
