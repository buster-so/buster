import React from 'react';

import type { iconProps } from './iconProps';

function photoFrame(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px photo frame';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,3c-.689,0-1.25-.561-1.25-1.25,0-.414-.336-.75-.75-.75H4.75c-.414,0-.75,.336-.75,.75,0,.689-.561,1.25-1.25,1.25-.414,0-.75,.336-.75,.75V14.25c0,.414,.336,.75,.75,.75,.689,0,1.25,.561,1.25,1.25,0,.414,.336,.75,.75,.75H13.25c.414,0,.75-.336,.75-.75,0-.689,.561-1.25,1.25-1.25,.414,0,.75-.336,.75-.75V3.75c0-.414-.336-.75-.75-.75Zm-6.25,11.5c-2.481,0-4.5-2.467-4.5-5.5S6.519,3.5,9,3.5s4.5,2.467,4.5,5.5-2.019,5.5-4.5,5.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default photoFrame;
