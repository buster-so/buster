import React from 'react';

import type { iconProps } from './iconProps';

function cursorDefault(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cursor default';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.554,5.748L3.724,1.367c-.679-.251-1.423-.09-1.935,.423-.513,.513-.674,1.253-.422,1.933L5.748,15.553c.27,.728,.944,1.197,1.72,1.197h.01c.778-.004,1.452-.48,1.716-1.213l1.626-4.517c.033-.093,.106-.167,.201-.201l4.517-1.626c.733-.264,1.209-.938,1.213-1.717,.004-.779-.466-1.458-1.196-1.728Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cursorDefault;
