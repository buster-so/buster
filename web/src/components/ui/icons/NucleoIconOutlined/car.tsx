import React from 'react';

import type { iconProps } from './iconProps';

function car(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px car';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,13.25v1.5c0,.276,.224,.5,.5,.5h1c.276,0,.5-.224,.5-.5v-1.5H1.75Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,13.25v1.5c0,.276,.224,.5,.5,.5h1c.276,0,.5-.224,.5-.5v-1.5h-2Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.012,2.75H5.988c-.883,0-1.662,.579-1.916,1.425l-1.072,3.575-.664,.664c-.375,.375-.586,.884-.586,1.414v3.422h14.5v-3.422c0-.53-.211-1.039-.586-1.414l-.664-.664-1.072-3.575c-.254-.846-1.032-1.425-1.916-1.425Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.5 7.75L16.5 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.5 10.75L10.5 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="4.25" cy="10.25" fill="currentColor" r=".75" />
        <circle cx="13.75" cy="10.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default car;
