import React from 'react';

import type { iconProps } from './iconProps';

function calendarAttachment(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar attachment';

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
          d="M14.75,18c-1.792,0-3.25-1.458-3.25-3.25v-2.5c0-1.103,.897-2,2-2s2,.897,2,2v2c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2c0-.276-.225-.5-.5-.5s-.5,.224-.5,.5v2.5c0,.965,.785,1.75,1.75,1.75s1.75-.785,1.75-1.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,1.792-1.458,3.25-3.25,3.25Z"
          fill="currentColor"
        />
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h5.551c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.689,0-1.25-.561-1.25-1.25V7H15v2.253c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default calendarAttachment;
