import React from 'react';

import type { iconProps } from './iconProps';

function artificialIntelligence(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px artificial intelligence';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.318 12.75L5.748 4.25 5.57 4.25 2 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.84 10.75L8.478 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 12.75L16 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 7.25L13.75 7.25 13.75 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.706,2.286l-1.145-.382-.382-1.145c-.124-.37-.737-.37-.86,0l-.382,1.145-1.145,.382c-.185,.062-.31,.235-.31,.43s.125,.368,.31,.43l1.145,.382,.382,1.145c.062,.185,.235,.31,.43,.31s.368-.125,.43-.31l.382-1.145,1.145-.382c.185-.062,.31-.235,.31-.43s-.125-.368-.31-.43Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default artificialIntelligence;
