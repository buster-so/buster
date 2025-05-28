import React from 'react';

import type { iconProps } from './iconProps';

function uiCard(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ui card';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m13.25,2H4.75c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75V4.75c0-1.5166-1.2334-2.75-2.75-2.75Zm-4.5,11.5h-3.5c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h3.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Zm4,0h-1c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h1c.4141,0,.75.3359.75.75s-.3359.75-.75.75Zm.75-4.25c0,.4141-.3359.75-.75.75h-7.5c-.4141,0-.75-.3359-.75-.75v-4c0-.4141.3359-.75.75-.75h7.5c.4141,0,.75.3359.75.75v4Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default uiCard;
