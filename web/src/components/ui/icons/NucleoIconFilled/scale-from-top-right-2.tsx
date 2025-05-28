import React from 'react';

import type { iconProps } from './iconProps';

function scaleFromTopRight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scale from top right 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,10c-.414,0-.75,.336-.75,.75v2.5c0,.689-.561,1.25-1.25,1.25H4.75c-.689,0-1.25-.561-1.25-1.25V4.75c0-.689,.561-1.25,1.25-1.25h2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75v-2.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="7.5" width="7.5" fill="currentColor" rx="2.75" ry="2.75" x="8.5" y="2" />
      </g>
    </svg>
  );
}

export default scaleFromTopRight2;
