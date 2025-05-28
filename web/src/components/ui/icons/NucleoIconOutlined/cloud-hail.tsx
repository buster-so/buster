import React from 'react';

import type { iconProps } from './iconProps';

function cloudHail(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud hail';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="11.75" cy="16.25" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="16.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="14.75" fill="currentColor" r=".75" />
        <circle cx="11.75" cy="13.25" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="13.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="11.75" fill="currentColor" r=".75" />
        <path
          d="M14.477,13.687c1.064-.662,1.773-1.842,1.773-3.187,0-1.736-1.185-3.182-2.786-3.609-.186-2.314-2.102-4.141-4.464-4.141-2.485,0-4.5,2.015-4.5,4.5,0,.35,.049,.686,.124,1.013-1.597,.067-2.874,1.374-2.874,2.987,0,1.208,.714,2.249,1.743,2.725"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.705,8c.687-.767,1.684-1.25,2.795-1.25,.333,0,.657,.059,.964,.141"
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

export default cloudHail;
