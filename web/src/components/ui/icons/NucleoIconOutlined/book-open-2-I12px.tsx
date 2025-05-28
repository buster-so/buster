import React from 'react';

import type { iconProps } from './iconProps';

function bookOpen2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px book open 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6,11.25l4.525-1.293c.429-.123.725-.515.725-.962V2.076c0-.664-.636-1.144-1.275-.962l-3.975,1.136"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.025,1.114l3.975,1.136v9l-4.525-1.293c-.429-.123-.725-.515-.725-.962V2.076c0-.664.636-1.144,1.275-.962Z"
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

export default bookOpen2;
