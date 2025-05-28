import React from 'react';

import type { iconProps } from './iconProps';

function vrHeadset4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vr headset 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,4.75c2.073,0,4.654,.077,5.933,1.113,1.279,1.036,1.756,2.106,1.5,4.023-.256,1.917-1.415,2.952-2.756,3.263-1.341,.311-2.431-.142-2.992-.75-.605-.656-.925-1.215-1.685-1.215-.76,0-1.08,.559-1.685,1.215-.561,.608-1.651,1.061-2.992,.75-1.341-.311-2.501-1.346-2.756-3.263-.256-1.917,.222-2.987,1.5-4.023,1.279-1.036,3.86-1.113,5.933-1.113Z"
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

export default vrHeadset4;
