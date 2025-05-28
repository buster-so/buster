import React from 'react';

import type { iconProps } from './iconProps';

function notEqual(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px not equal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.25,7.5H2.75c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h12.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,12H2.75c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h12.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2,16.75c-.1924,0-.3838-.0732-.5303-.2197-.293-.293-.293-.7676,0-1.0605L15.4697,1.4697c.293-.293.7676-.293,1.0605,0s.293.7676,0,1.0605L2.5303,16.5303c-.1465.1465-.3379.2197-.5303.2197Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default notEqual;
