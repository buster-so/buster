import React from 'react';

import type { iconProps } from './iconProps';

function gamepad4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gamepad 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,1h-3.75c-.414,0-.75,.336-.75,.75v1.25h-3c-2.068,0-3.75,1.682-3.75,3.75v6.5c0,2.068,1.682,3.75,3.75,3.75h3.75c.414,0,.75-.336,.75-.75v-1.25h3c2.068,0,3.75-1.682,3.75-3.75V4.75c0-2.068-1.682-3.75-3.75-3.75ZM4.741,6.366c.488-.488,1.28-.488,1.768,0,.488,.488,.488,1.28,0,1.768-.488,.488-1.28,.488-1.768,0-.488-.488-.488-1.28,0-1.768Zm.009,7.634c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm1.5-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm8.75-1.25c0,1.241-1.009,2.25-2.25,2.25h-3V2.5h3c1.241,0,2.25,1.009,2.25,2.25v6.5Z"
          fill="currentColor"
        />
        <circle cx="12.375" cy="10.75" fill="currentColor" r="1.25" />
        <circle cx="13.25" cy="4.75" fill="currentColor" r=".75" />
        <circle cx="11.75" cy="6.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default gamepad4;
