import React from 'react';

import type { iconProps } from './iconProps';

function alignHorizontal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px align horizontal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,17c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v14.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <rect height="5" width="5" fill="currentColor" rx="1.75" ry="1.75" x="3" y="10" />
        <rect height="5" width="8" fill="currentColor" rx="1.75" ry="1.75" x="5" y="3" />
      </g>
    </svg>
  );
}

export default alignHorizontal;
