import React from 'react';

import type { iconProps } from './iconProps';

function calendarUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar user';

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
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h5.674c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.689,0-1.25-.561-1.25-1.25V7H15v1.447c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.697c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M17.932,16.346c-.488-1.403-1.811-2.346-3.291-2.346s-2.803,.943-3.292,2.346c-.13,.375-.068,.795,.164,1.122,.237,.333,.621,.532,1.027,.532h4.201c.406,0,.79-.199,1.027-.532,.232-.327,.294-.747,.163-1.123Z"
          fill="currentColor"
        />
        <circle cx="14.641" cy="11.75" fill="currentColor" r="1.75" />
      </g>
    </svg>
  );
}

export default calendarUser;
