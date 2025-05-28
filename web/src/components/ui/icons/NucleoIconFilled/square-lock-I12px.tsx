import React from 'react';

import type { iconProps } from './iconProps';

function squareLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-3.5,7.852v2.398c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.398c-.732-.297-1.25-1.013-1.25-1.852,0-1.104,.895-2,2-2s2,.896,2,2c0,.839-.518,1.555-1.25,1.852Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareLock;
