import React from 'react';

import type { iconProps } from './iconProps';

function calendarRefresh(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar refresh';

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
          d="M16.75,10c-.414,0-.75,.336-.75,.75v.375c-.572-.398-1.263-.625-2-.625-1.93,0-3.5,1.57-3.5,3.5s1.57,3.5,3.5,3.5c.96,0,1.888-.4,2.546-1.098,.284-.301,.27-.776-.031-1.06s-.777-.27-1.061,.031c-.381,.405-.897,.627-1.454,.627-1.103,0-2-.897-2-2s.897-2,2-2c.494,0,.94,.193,1.295,.5h-1.045c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.5c.414,0,.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h4.667c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.689,0-1.25-.561-1.25-1.25V7H15v1.473c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.723c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default calendarRefresh;
