import React from 'react';

import type { iconProps } from './iconProps';

function arrowUpRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow up right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m1.75,11c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L9.543,1.396c.293-.293.768-.293,1.061,0s.293.768,0,1.061L2.28,10.78c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.25,7.25c-.414,0-.75-.336-.75-.75V2.5h-4c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h4.75c.414,0,.75.336.75.75v4.75c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowUpRight;
