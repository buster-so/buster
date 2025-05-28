import React from 'react';

import type { iconProps } from './iconProps';

function airplay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px airplay';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.25,13.25h-.5c-1.105,0-2-.895-2-2V5.25c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2v6c0,1.105-.895,2-2,2h-.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.586,11.659l-2.58,3.811c-.225,.332,.013,.78,.414,.78h5.16c.401,0,.639-.448,.414-.78l-2.58-3.811c-.198-.293-.63-.293-.828,0Z"
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

export default airplay;
