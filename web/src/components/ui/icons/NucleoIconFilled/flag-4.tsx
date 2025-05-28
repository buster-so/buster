import React from 'react';

import type { iconProps } from './iconProps';

function flag4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flag 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.241,5.577L4.01,1.796s-.007,0-.01,0V11.705s.007,0,.01-.002l10.231-3.781c.496-.184,.816-.644,.816-1.173s-.32-.989-.817-1.173Z"
          fill="currentColor"
        />
        <path
          d="M3.75,17c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v14.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default flag4;
