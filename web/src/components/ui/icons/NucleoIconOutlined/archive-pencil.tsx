import React from 'react';

import type { iconProps } from './iconProps';

function archivePencil(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px archive pencil';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.25,10.25v1c0,.552-.448,1-1,1h-2.5c-.552,0-1-.448-1-1v-1H2.75v3c0,1.104.895,2,2,2h8.5c1.105,0,2-.896,2-2v-3h-4Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 10.25L15.25 8.014"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.9849,2.75h-5.2349c-1.105,0-2,.896-2,2v5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m13.2067,6.4009c.1432-.0495.2733-.1309.3805-.238l3.3031-3.3031c.4832-.4833.4778-1.2613-.0054-1.7446h0c-.4833-.4833-1.2613-.4887-1.7446-.0055l-3.3031,3.3031c-.1071.1071-.1885.2372-.238.3805l-.8491,2.4567,2.4567-.8491Z"
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

export default archivePencil;
