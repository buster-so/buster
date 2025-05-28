import React from 'react';

import type { iconProps } from './iconProps';

function files2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px files 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.78,3.22L7.78,1.22c-.141-.141-.332-.22-.53-.22H3.25c-.965,0-1.75,.785-1.75,1.75v7c0,.965,.785,1.75,1.75,1.75h3c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.25c-.138,0-.25-.112-.25-.25V2.75c0-.138,.112-.25,.25-.25h3.25v1.25c0,.414,.336,.75,.75,.75h1.25v.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1c0-.199-.079-.39-.22-.53Z"
          fill="currentColor"
        />
        <path
          d="M16.28,8.72l-2-2c-.141-.141-.332-.22-.53-.22h-4c-.965,0-1.75,.785-1.75,1.75v7c0,.965,.785,1.75,1.75,1.75h5c.965,0,1.75-.785,1.75-1.75v-6c0-.199-.079-.39-.22-.53Zm-.841,1.28h-1.939c-.276,0-.5-.224-.5-.5v-1.939l2.439,2.439Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default files2;
