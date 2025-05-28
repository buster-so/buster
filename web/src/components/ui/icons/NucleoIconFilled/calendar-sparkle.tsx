import React from 'react';

import type { iconProps } from './iconProps';

function calendarSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar sparkle';

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
          d="M14.25,18c-.284,0-.544-.161-.671-.415l-.888-1.776-1.776-.888c-.254-.127-.415-.387-.415-.671s.161-.544,.415-.671l1.776-.888,.888-1.776c.254-.508,1.088-.508,1.342,0l.888,1.776,1.776,.888c.254,.127,.415,.387,.415,.671s-.161,.544-.415,.671l-1.776,.888-.888,1.776c-.127,.254-.387,.415-.671,.415Z"
          fill="currentColor"
        />
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h4.734c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.689,0-1.25-.561-1.25-1.25V7H15v2.277c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default calendarSparkle;
