import React from 'react';

import type { iconProps } from './iconProps';

function folder5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px folder 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.75,2.75h2.864l-.298-.636c-.247-.527-.776-.864-1.358-.864h-1.708c-.828,0-1.5.672-1.5,1.5v2c0-1.105.895-2,2-2Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m.75,4.75v-2c0-.828.672-1.5,1.5-1.5h1.708c.582,0,1.111.337,1.358.864l.298.636"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.75,2.75h6.5c1.105,0,2,.895,2,2v3.5c0,1.105-.895,2-2,2H2.75c-1.105,0-2-.895-2-2v-3.5c0-1.105.895-2,2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default folder5;
