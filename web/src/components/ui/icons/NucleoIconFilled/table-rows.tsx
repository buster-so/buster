import React from 'react';

import type { iconProps } from './iconProps';

function tableRows(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table rows';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16,8.25v-3.5c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75v3.5h14Z"
          fill="currentColor"
        />
        <path
          d="M2,9.75v3.5c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75v-3.5H2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableRows;
