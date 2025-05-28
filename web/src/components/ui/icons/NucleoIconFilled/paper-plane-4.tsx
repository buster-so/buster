import React from 'react';

import type { iconProps } from './iconProps';

function paperPlane4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px paper plane 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.142,4.595L2.54.179C1.977-.112,1.32-.044.827.352.334.748.128,1.374.288,1.987l.851,3.265h3.111c.414,0,.75.336.75.75s-.336.75-.75.75H1.148l-.86,3.265c-.16.612.046,1.238.539,1.634.29.233.636.352.986.352.246,0,.494-.059.727-.178l8.602-4.417c.529-.272.858-.811.858-1.406s-.329-1.134-.858-1.406Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default paperPlane4;
