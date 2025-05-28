import React from 'react';

import type { iconProps } from './iconProps';

function userUpdate(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user update';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <circle cx="14.75" cy="15.25" fill="currentColor" r="1.75" />
        <path
          d="M11.5,15.25c0-1.782,1.443-3.231,3.221-3.247-1.292-1.851-3.412-3.003-5.721-3.003-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.967,0,1.928-.094,2.878-.262-.233-.448-.378-.949-.378-1.488Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userUpdate;
