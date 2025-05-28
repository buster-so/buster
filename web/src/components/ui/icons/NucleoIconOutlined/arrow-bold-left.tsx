import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.448,3.609L1.867,8.602c-.264,.2-.264,.597,0,.797l6.581,4.993c.329,.25,.802,.015,.802-.398v-2.743h6c.552,0,1-.448,1-1v-2.5c0-.552-.448-1-1-1h-6v-2.743c0-.413-.473-.648-.802-.398Z"
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

export default arrowBoldLeft;
