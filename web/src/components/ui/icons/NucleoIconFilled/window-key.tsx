import React from 'react';

import type { iconProps } from './iconProps';

function windowKey(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h3c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25v-5.25H15.5v3.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM4,6c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,0c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M17.25,13.5h-3.878c-.321-1.011-1.257-1.75-2.372-1.75-1.379,0-2.5,1.122-2.5,2.5s1.121,2.5,2.5,2.5c1.116,0,2.052-.739,2.372-1.75h1.628v.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.75h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Zm-6.25,1.75c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default windowKey;
