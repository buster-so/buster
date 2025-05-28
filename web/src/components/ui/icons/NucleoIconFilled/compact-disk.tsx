import React from 'react';

import type { iconProps } from './iconProps';

function compactDisk(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px compact disk';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm0,10.5c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5,2.5,1.119,2.5,2.5-1.119,2.5-2.5,2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default compactDisk;
