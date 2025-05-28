import React from 'react';

import type { iconProps } from './iconProps';

function imageMountain2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px image mountain 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="2.75" cy="2.75" fill="currentColor" r="1.75" strokeWidth="0" />
        <path
          d="m11.022,9.14l-1.463-4.635c-.142-.448-.494-.798-.943-.936-.447-.139-.938-.048-1.308.244,0,0,0,0,0,0L1.454,8.449c-.484.383-.666,1.007-.463,1.59.202.584.732.961,1.351.961h7.317c.454,0,.886-.219,1.154-.585.268-.366.346-.843.209-1.275Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default imageMountain2;
