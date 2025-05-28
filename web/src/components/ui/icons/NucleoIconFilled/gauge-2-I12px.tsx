import React from 'react';

import type { iconProps } from './iconProps';

function gauge2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gauge 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm0,9.75c-.965,0-1.75-.785-1.75-1.75,0-.205,.042-.399,.107-.582l-2.754-2.754c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.754,2.754c.183-.065,.377-.107,.582-.107,.965,0,1.75,.785,1.75,1.75s-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default gauge2;
