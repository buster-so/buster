import React from 'react';

import type { iconProps } from './iconProps';

function editSquare(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px edit square';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,13c-.414,0-.75-.336-.75-.75V5.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,15H5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,13c-.414,0-.75-.336-.75-.75V5.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,4.5H5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="1.5" y="12" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="1.5" y="1.5" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="12" y="1.5" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="12" y="12" />
      </g>
    </svg>
  );
}

export default editSquare;
