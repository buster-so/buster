import React from 'react';

import type { iconProps } from './iconProps';

function alignRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px align right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,17c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v14.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <rect height="5" width="11" fill="currentColor" rx="1.75" ry="1.75" x="2" y="3" />
        <rect height="5" width="7" fill="currentColor" rx="1.75" ry="1.75" x="6" y="10" />
      </g>
    </svg>
  );
}

export default alignRight;
