import React from 'react';

import type { iconProps } from './iconProps';

function playlist2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px playlist 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.715,8.482l-2.308-1.385c-.403-.242-.916,.048-.916,.518v2.771c0,.47,.513,.76,.916,.518l2.308-1.385c.391-.235,.391-.802,0-1.037Z"
          fill="currentColor"
        />
        <path
          d="M3,13.75h-.25c-.828,0-1.5-.672-1.5-1.5V5.75c0-.828,.672-1.5,1.5-1.5h.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,13.75h.25c.828,0,1.5-.672,1.5-1.5V5.75c0-.828-.672-1.5-1.5-1.5h-.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="12.5"
          width="7.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 9 9)"
          x="5.25"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default playlist2;
