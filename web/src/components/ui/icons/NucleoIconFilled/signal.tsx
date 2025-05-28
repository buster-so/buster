import React from 'react';

import type { iconProps } from './iconProps';

function signal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px signal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,15c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M5.75,15c-.414,0-.75-.336-.75-.75v-4c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,15c-.414,0-.75-.336-.75-.75V7.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,15c-.414,0-.75-.336-.75-.75V5.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V14.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,15c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V14.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default signal;
