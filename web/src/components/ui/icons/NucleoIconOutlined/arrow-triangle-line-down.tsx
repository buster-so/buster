import React from 'react';

import type { iconProps } from './iconProps';

function arrowTriangleLineDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow triangle line down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 10.25L9 2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.414,15.547l3.058-4.516c.225-.332-.013-.78-.414-.78H5.942c-.401,0-.639,.448-.414,.78l3.058,4.516c.198,.293,.63,.293,.828,0Z"
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

export default arrowTriangleLineDown;
