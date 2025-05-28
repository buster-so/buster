import React from 'react';

import type { iconProps } from './iconProps';

function carousel(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px carousel';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,5h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.25c-1.24,0-2.25,1.009-2.25,2.25v6.5c0,1.241,1.01,2.25,2.25,2.25h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.25c-.413,0-.75-.336-.75-.75V5.75c0-.414,.337-.75,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,3.5h-.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25c.413,0,.75,.336,.75,.75v6.5c0,.414-.337,.75-.75,.75h-.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25c1.24,0,2.25-1.009,2.25-2.25V5.75c0-1.241-1.01-2.25-2.25-2.25Z"
          fill="currentColor"
        />
        <rect height="14" width="9" fill="currentColor" rx="2.75" ry="2.75" x="4.5" y="2" />
      </g>
    </svg>
  );
}

export default carousel;
