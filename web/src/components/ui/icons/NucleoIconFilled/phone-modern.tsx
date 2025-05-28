import React from 'react';

import type { iconProps } from './iconProps';

function phoneModern(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px phone modern';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,1H5.75c-.965,0-1.75,.785-1.75,1.75V15.25c0,.965,.785,1.75,1.75,1.75h6.5c.965,0,1.75-.785,1.75-1.75V2.75c0-.965-.785-1.75-1.75-1.75Zm.25,3V13H5.5V4h7Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default phoneModern;
