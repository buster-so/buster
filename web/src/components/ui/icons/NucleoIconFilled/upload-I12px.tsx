import React from 'react';

import type { iconProps } from './iconProps';

function upload(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px upload';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.908,12.625l-.816-3.5c-.292-1.251-1.394-2.125-2.678-2.125h-2.663v5.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V7h-2.663c-1.285,0-2.386,.874-2.678,2.125l-.816,3.5c-.192,.822,0,1.673,.524,2.334,.524,.662,1.31,1.041,2.154,1.041H13.229c.844,0,1.63-.379,2.154-1.041,.525-.661,.716-1.512,.524-2.334Z"
          fill="currentColor"
        />
        <path
          d="M12.53,4.22l-3-3c-.293-.293-.768-.293-1.061,0l-3,3c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l1.72-1.72v3.439h1.5V3.561l1.72,1.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default upload;
