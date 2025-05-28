import React from 'react';

import type { iconProps } from './iconProps';

function battery(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px battery';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.25,7h-.75v-.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v5.5c0,1.517,1.233,2.75,2.75,2.75H13.75c1.517,0,2.75-1.233,2.75-2.75v-.75h.75c.414,0,.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75Zm-2.25,4.75c0,.689-.561,1.25-1.25,1.25H3.75c-.689,0-1.25-.561-1.25-1.25V6.25c0-.689,.561-1.25,1.25-1.25H13.75c.689,0,1.25,.561,1.25,1.25v5.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default battery;
