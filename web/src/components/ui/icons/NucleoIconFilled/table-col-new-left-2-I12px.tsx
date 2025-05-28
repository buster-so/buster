import React from 'react';

import type { iconProps } from './iconProps';

function tableColNewLeft2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table col new left 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.75,8.25h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="16" width="6" fill="currentColor" rx="2.25" ry="2.25" x="9" y="1" />
      </g>
    </svg>
  );
}

export default tableColNewLeft2;
