import React from 'react';

import type { iconProps } from './iconProps';

function doctor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px doctor';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.953,16c1.298-1.958,3.522-3.25,6.047-3.25s4.749,1.291,6.047,3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75 16.25L12 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,5.75c-2.5-1.333-5-1.333-7.5,0V2.25c2.5-1.333,5-1.333,7.5,0v3.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,5.75v.75c0,2.071-1.679,3.75-3.75,3.75s-3.75-1.679-3.75-3.75v-.75"
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

export default doctor;
