import React from 'react';

import type { iconProps } from './iconProps';

function maskCircle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mask circle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm0,1.5c.458,0,.905,.049,1.336,.139,.099,.455,.164,.911,.164,1.361,0,3.584-2.916,6.5-6.5,6.5-.45,0-.906-.065-1.36-.164-.091-.431-.14-.878-.14-1.336,0-3.584,2.916-6.5,6.5-6.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default maskCircle;
