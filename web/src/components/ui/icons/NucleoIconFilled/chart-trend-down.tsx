import React from 'react';

import type { iconProps } from './iconProps';

function chartTrendDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart trend down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,6.5c-.414,0-.75,.336-.75,.75v1.689l-2.866-2.866c-.486-.487-1.281-.487-1.768,0l-3.116,3.116-3.47-3.47-1.061,1.061,3.646,3.646c.486,.487,1.281,.487,1.768,0l3.116-3.116,2.689,2.689h-1.689c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.5c.414,0,.75-.336,.75-.75v-3.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,15.5H4.75c-1.517,0-2.75-1.233-2.75-2.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V12.75c0,.689,.561,1.25,1.25,1.25H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartTrendDown;
