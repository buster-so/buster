import React from 'react';

import type { iconProps } from './iconProps';

function squareDashedContent(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square dashed content';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,5.5c.414,0,.75-.336,.75-.75,0-.689,.561-1.25,1.25-1.25,.414,0,.75-.336,.75-.75s-.336-.75-.75-.75c-1.517,0-2.75,1.233-2.75,2.75,0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,3.5c.689,0,1.25,.561,1.25,1.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-1.517-1.233-2.75-2.75-2.75-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,12.5c-.414,0-.75,.336-.75,.75,0,.689-.561,1.25-1.25,1.25-.414,0-.75,.336-.75,.75s.336,.75,.75,.75c1.517,0,2.75-1.233,2.75-2.75,0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M4.75,14.5c-.689,0-1.25-.561-1.25-1.25,0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,1.517,1.233,2.75,2.75,2.75,.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M7.75,3.5h2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.25,14.5h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,7c-.414,0-.75,.336-.75,.75v2.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,11c.414,0,.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.5c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <rect height="8" width="8" fill="currentColor" rx=".75" ry=".75" x="5" y="5" />
      </g>
    </svg>
  );
}

export default squareDashedContent;
