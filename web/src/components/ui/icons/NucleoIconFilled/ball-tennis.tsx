import React from 'react';

import type { iconProps } from './iconProps';

function ballTennis(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px ball tennis';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.903,7.041c-.135-.012-.265-.041-.403-.041-2.481,0-4.5,2.019-4.5,4.5,0,.138.029.268.041.403,2.474-.435,4.427-2.388,4.863-4.863Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m.097,4.959c.135.012.265.041.403.041,2.481,0,4.5-2.019,4.5-4.5,0-.138-.029-.268-.041-.403C2.485.532.532,2.485.097,4.959Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5.5,11.5c0-3.309,2.691-6,6-6,.161,0,.318.012.476.024C11.744,2.595,9.405.256,6.476.024c.012.157.024.315.024.476,0,3.309-2.691,6-6,6-.161,0-.318-.012-.476-.024.232,2.929,2.571,5.268,5.5,5.5-.012-.157-.024-.315-.024-.476Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default ballTennis;
