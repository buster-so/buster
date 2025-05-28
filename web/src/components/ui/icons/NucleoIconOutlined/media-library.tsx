import React from 'react';

import type { iconProps } from './iconProps';

function mediaLibrary(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media library';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.211,6.984l-2.296-1.385c-.402-.243-.915,.047-.915,.516v2.771c0,.47,.513,.759,.915,.516l2.296-1.385c.389-.235,.389-.798,0-1.033Z"
          fill="currentColor"
        />
        <path
          d="M1.75,6.75v6.5c0,1.105,.895,2,2,2H12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="9.5"
          width="11.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 10.5 7.5)"
          x="4.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default mediaLibrary;
