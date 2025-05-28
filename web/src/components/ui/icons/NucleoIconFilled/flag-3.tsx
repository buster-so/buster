import React from 'react';

import type { iconProps } from './iconProps';

function flag3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px flag 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.561,4.5l2.22-2.22c.214-.214.279-.537.163-.817s-.39-.463-.693-.463H3v7h7.25c.303,0,.577-.183.693-.463s.052-.603-.163-.817l-2.22-2.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.75,12c-.414,0-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75v10.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default flag3;
