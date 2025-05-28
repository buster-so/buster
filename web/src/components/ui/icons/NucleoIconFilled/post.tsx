import React from 'react';

import type { iconProps } from './iconProps';

function post(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px post';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m13.25,2H4.75c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75V4.75c0-1.5166-1.2334-2.75-2.75-2.75Zm-7.25,3c.5523,0,1,.4478,1,1s-.4477,1-1,1-1-.4478-1-1,.4478-1,1-1Zm3.25,8h-3.5c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h3.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Zm3-3h-6.5c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h6.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default post;
