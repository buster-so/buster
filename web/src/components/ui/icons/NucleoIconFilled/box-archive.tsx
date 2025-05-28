import React from 'react';

import type { iconProps } from './iconProps';

function boxArchive(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px box archive';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.25.5H1.75c-.965,0-1.75.785-1.75,1.75s.785,1.75,1.75,1.75h8.5c.965,0,1.75-.785,1.75-1.75s-.785-1.75-1.75-1.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.25,5.5H1.75c-.259,0-.508-.038-.75-.096v3.346c0,1.517,1.233,2.75,2.75,2.75h4.5c1.517,0,2.75-1.233,2.75-2.75v-3.346c-.242.058-.491.096-.75.096Zm-3.25,3h-2c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default boxArchive;
