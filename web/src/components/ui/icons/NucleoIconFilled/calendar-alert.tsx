import React from 'react';

import type { iconProps } from './iconProps';

function calendarAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar alert';

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
          d="M12.25,14.75c-.414,0-.75-.336-.75-.75v-2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h5.712c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.689,0-1.25-.561-1.25-1.25V7H15v6.25c0,.515-.312,.97-.794,1.16-.386,.151-.576,.586-.425,.972,.151,.385,.586,.576,.972,.424,1.062-.416,1.747-1.419,1.747-2.556V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <circle cx="12.25" cy="16.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default calendarAlert;
