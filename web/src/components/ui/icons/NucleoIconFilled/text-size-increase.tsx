import React from 'react';

import type { iconProps } from './iconProps';

function textSizeIncrease(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text size increase';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.75,16c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V15.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13,3.5H2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H13c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,9h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textSizeIncrease;
