import React from 'react';

import type { iconProps } from './iconProps';

function tableUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="13.75" cy="10.75" fill="currentColor" r="1.75" />
        <path
          d="M17.041,15.346c-.488-1.403-1.811-2.346-3.291-2.346s-2.803,.943-3.292,2.346c-.13,.375-.068,.795,.164,1.122,.237,.333,.621,.532,1.027,.532h4.201c.406,0,.79-.199,1.027-.532,.232-.327,.294-.747,.163-1.123Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.519,1.231,2.75,2.75,2.75h3.951c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.201v-6.5H3.5v-1.5h3V3.5h1.5v3h6.5v1.101c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.851c0-1.519-1.231-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableUser;
