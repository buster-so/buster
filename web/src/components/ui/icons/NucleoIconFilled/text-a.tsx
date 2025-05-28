import React from 'react';

import type { iconProps } from './iconProps';

function textA(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px text a';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.958,9H3.042c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5.916c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.99,11.5c-.3,0-.584-.182-.699-.479L6,2.538l-3.291,8.483c-.15.386-.585.576-.971.428-.386-.15-.578-.584-.428-.971L4.996.979c.112-.289.39-.479.699-.479h.609c.31,0,.587.19.699.479l3.686,9.5c.15.386-.042.821-.428.971-.089.035-.181.051-.271.051Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default textA;
