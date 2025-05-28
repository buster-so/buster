import React from 'react';

import type { iconProps } from './iconProps';

function arrowTriangleLineUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow triangle line up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 7.75L9 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.586,2.453l-3.058,4.516c-.225,.332,.013,.78,.414,.78h6.115c.401,0,.639-.448,.414-.78l-3.058-4.516c-.198-.293-.63-.293-.828,0Z"
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

export default arrowTriangleLineUp;
