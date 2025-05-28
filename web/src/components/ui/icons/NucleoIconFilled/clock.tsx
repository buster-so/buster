import React from 'react';

import type { iconProps } from './iconProps';

function clock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0Zm2.564,8.244c-.148.169-.356.256-.565.256-.175,0-.351-.061-.493-.186l-2-1.75c-.163-.143-.256-.348-.256-.564v-2.75c0-.414.336-.75.75-.75s.75.336.75.75v2.41l1.744,1.526c.312.273.344.747.071,1.058Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default clock;
