import React from 'react';

import type { iconProps } from './iconProps';

function inboxArrowUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px inbox arrow up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.5 5.25L9 2.75 11.5 5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 2.75L9 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.214,9.75h-4.464v1c0,.552-.448,1-1,1h-3.5c-.552,0-1-.448-1-1v-1H1.787"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.482,2.78c.679,.119,1.259,.582,1.517,1.239l2.113,5.379c.092,.233,.138,.481,.138,.731v3.121c0,1.105-.895,2-2,2h-5.25s-5.25,0-5.25,0c-1.105,0-2-.895-2-2v-3.121c0-.25,.047-.498,.138-.731l2.113-5.379c.258-.656,.838-1.12,1.517-1.239"
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

export default inboxArrowUp;
