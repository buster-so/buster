import React from 'react';

import type { iconProps } from './iconProps';

function plus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,9.75H3.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H14.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,15.5c-.414,0-.75-.336-.75-.75V3.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V14.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default plus;
