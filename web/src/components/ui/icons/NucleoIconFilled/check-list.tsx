import React from 'react';

import type { iconProps } from './iconProps';

function checkList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px check list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.06,14.997c-.229,0-.446-.105-.589-.285l-2.742-3.473c-.256-.325-.201-.797,.124-1.054,.326-.257,.796-.201,1.054,.124l2.149,2.723L14.659,3.292c.255-.327,.726-.385,1.053-.13s.385,.726,.13,1.053L7.651,14.708c-.142,.182-.379,.262-.591,.289Z"
          fill="currentColor"
        />
        <path
          d="M10,4.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7,8H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H7c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default checkList;
