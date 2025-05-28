import React from 'react';

import type { iconProps } from './iconProps';

function bed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bed';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,12v-3.25c0-1.517-1.233-2.75-2.75-2.75h-5.5c-.414,0-.75,.336-.75,.75v5.25h9Z"
          fill="currentColor"
        />
        <path
          d="M16.25,11.5H2.5V3.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V14.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75H15.5v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <circle cx="5.25" cy="8.75" fill="currentColor" r="1.75" />
      </g>
    </svg>
  );
}

export default bed;
