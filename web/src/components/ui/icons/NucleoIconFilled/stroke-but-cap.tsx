import React from 'react';

import type { iconProps } from './iconProps';

function strokeButCap(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stroke but cap';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,7.5c-.414,0-.75-.336-.75-.75v-2c0-.138-.112-.25-.25-.25H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H13.25c.965,0,1.75,.785,1.75,1.75v2c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,15H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H13.25c.138,0,.25-.112,.25-.25v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,6c-1.394,0-2.558,.96-2.893,2.25H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H11.357c.335,1.29,1.5,2.25,2.893,2.25,1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default strokeButCap;
