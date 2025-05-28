import React from 'react';

import type { iconProps } from './iconProps';

function routeAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px route alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,9.75h-2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M3.25,9.75H1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H3.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,2.5c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5-2.916-6.5-6.5-6.5Zm0,10c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm.75-3c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default routeAlert;
