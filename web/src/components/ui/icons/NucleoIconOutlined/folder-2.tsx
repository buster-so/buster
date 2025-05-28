import React from 'react';

import type { iconProps } from './iconProps';

function folder2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.75,5.25c1.105,0,2,.895,2,2v5.5c0,1.105-.895,2-2,2H4.25c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h1.825c.587,0,1.144,.258,1.524,.705l1.524,1.795h4.626Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default folder2;
