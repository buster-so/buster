import React from 'react';

import type { iconProps } from './iconProps';

function arrowTurnRight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow turn right 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,7H3.25c-1.517,0-2.75-1.233-2.75-2.75v-2c0-.414.336-.75.75-.75s.75.336.75.75v2c0,.689.561,1.25,1.25,1.25h7.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.75,10.25c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.72-2.72-2.72-2.72c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.25,3.25c.293.293.293.768,0,1.061l-3.25,3.25c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowTurnRight2;
