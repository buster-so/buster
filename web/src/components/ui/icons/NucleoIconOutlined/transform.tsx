import React from 'react';

import type { iconProps } from './iconProps';

function transform(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px transform';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.106,1.82l8.5,3.238c.388,.148,.644,.52,.644,.934v6.02c0,.415-.256,.787-.644,.934l-8.5,3.238c-.655,.249-1.356-.234-1.356-.934V2.754c0-.7,.701-1.184,1.356-.934Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default transform;
