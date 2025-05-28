import React from 'react';

import type { iconProps } from './iconProps';

function userShortHair3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user short hair 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.75,6.5c0,2.071-1.679,3.75-3.75,3.75s-3.75-1.679-3.75-3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.953,16c1.298-1.958,3.522-3.25,6.047-3.25s4.749,1.291,6.047,3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,6.5v-.25c0-1.105-.895-2-2-2h-3.5c-1.105,0-2,.895-2,2V2.75c0-.552,.448-1,1-1h5.5c.552,0,1,.448,1,1v3.75Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default userShortHair3;
