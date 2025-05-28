import React from 'react';

import type { iconProps } from './iconProps';

function boxArchive3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box archive 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.2505,5.5c-.228,0-.4531-.1035-.6006-.2998l-2.0249-2.7002h-7.25l-2.0249,2.7002c-.2485.3315-.7178.3984-1.0503.1499-.3311-.2485-.3984-.7188-.1499-1.0503l2.25-3c.1416-.1885.3643-.2998.6001-.2998h8c.2358,0,.4585.1113.6001.2998l2.25,3c.2485.3315.1812.8018-.1499,1.0503-.1353.1011-.293.1499-.4497.1499Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,4H2.75c-.4141,0-.75.3359-.75.75v9.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75V4.75c0-.4141-.3359-.75-.75-.75Zm-4.25,4.5h-4c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h4c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default boxArchive3;
