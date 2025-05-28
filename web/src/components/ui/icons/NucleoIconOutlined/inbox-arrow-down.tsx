import React from 'react';

import type { iconProps } from './iconProps';

function inboxArrowDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px inbox arrow down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.5 5.75L9 8.25 6.5 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 8.25L9 2.75"
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
          d="M12,2.75h.137c.822,0,1.561,.503,1.862,1.269l2.113,5.379c.092,.233,.138,.481,.138,.731v3.121c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2v-3.121c0-.25,.047-.498,.138-.731l2.113-5.379c.301-.765,1.039-1.269,1.862-1.269h.137"
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

export default inboxArrowDown;
