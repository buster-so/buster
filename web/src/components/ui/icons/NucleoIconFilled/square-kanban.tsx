import React from 'react';

import type { iconProps } from './iconProps';

function squareKanban(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square kanban';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m2,4.75v8.5c0,1.517,1.233,2.75,2.75,2.75h8.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75Zm8,.5c0-.414.336-.75.75-.75h2c.414,0,.75.336.75.75v3c0,.414-.336.75-.75.75h-2c-.414,0-.75-.336-.75-.75v-3Zm-5.5,0c0-.414.336-.75.75-.75h2c.414,0,.75.336.75.75v7.5c0,.414-.336.75-.75.75h-2c-.414,0-.75-.336-.75-.75v-7.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squareKanban;
