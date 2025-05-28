import React from 'react';

import type { iconProps } from './iconProps';

function dresser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dresser';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.75,17c-.414,0-.75-.336-.75-.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,17c-.414,0-.75-.336-.75-.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16,7.5v-3.25c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75v3.25h14ZM7.25,3.5h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-3.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2,9v3.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75v-3.25H2Zm8.75,3.5h-3.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default dresser;
