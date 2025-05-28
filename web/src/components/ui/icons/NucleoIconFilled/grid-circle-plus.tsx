import React from 'react';

import type { iconProps } from './iconProps';

function gridCirclePlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid circle plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.5,12h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <circle cx="5" cy="5" fill="currentColor" r="3.25" />
        <circle cx="13" cy="5" fill="currentColor" r="3.25" />
        <circle cx="5" cy="13" fill="currentColor" r="3.25" />
      </g>
    </svg>
  );
}

export default gridCirclePlus;
