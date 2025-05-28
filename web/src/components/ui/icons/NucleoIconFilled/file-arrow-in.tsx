import React from 'react';

import type { iconProps } from './iconProps';

function fileArrowIn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file arrow in';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.487,5.427l-3.915-3.915c-.3278-.3279-.7724-.512-1.236-.512h-4.586c-1.5188,0-2.75,1.2312-2.75,2.75v5.25h4.4395l-1.2197-1.2197c-.293-.293-.293-.7676,0-1.0605s.7676-.293,1.0605,0l2.5,2.5c.293.293.293.7676,0,1.0605l-2.5,2.5c-.1465.1465-.3379.2197-.5303.2197s-.3838-.0732-.5303-.2197c-.293-.293-.293-.7676,0-1.0605l1.2197-1.2197H3v3.75c0,1.5188,1.2312,2.75,2.75,2.75h7.5c1.5188,0,2.75-1.2312,2.75-2.75v-7.5845c0-.4646-.1845-.9102-.513-1.2385Zm-1.054,1.073h-2.932c-.55,0-1-.45-1-1v-2.9209h-.001c.009-.0042.004-.001.013-.0051l3.922,3.9211s-.001.0029-.002.0049Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3,9H.75c-.4141,0-.75.3359-.75.75s.3359.75.75.75h2.25v-1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default fileArrowIn;
