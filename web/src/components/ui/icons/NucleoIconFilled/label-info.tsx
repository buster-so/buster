import React from 'react';

import type { iconProps } from './iconProps';

function labelInfo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label info';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m13.0947,5.3486l-3.9204-3.5469c-.6699-.6055-1.6792-.6055-2.3481,0l-3.9209,3.5469c-.5752.52-.9053,1.2637-.9053,2.0396v6.8618c0,1.5161,1.2334,2.75,2.75,2.75h3.5118c-.7884-1.0459-1.2618-2.3423-1.2618-3.75,0-3.4463,2.8037-6.25,6.25-6.25.2416,0,.4791.0171.7136.0439-.0827-.6475-.3801-1.2534-.8689-1.6953Zm-5.0947,2.6514c-.6904,0-1.25-.5596-1.25-1.25s.5596-1.25,1.25-1.25,1.25.5596,1.25,1.25-.5596,1.25-1.25,1.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m13.25,8.5c-2.6197,0-4.75,2.1303-4.75,4.75s2.1303,4.75,4.75,4.75,4.75-2.1303,4.75-4.75-2.1303-4.75-4.75-4.75Zm.75,7c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-2c0-.4141.3359-.75.75-.75s.75.3359.75.75v2Zm-.75-3.5c-.4832,0-.875-.3918-.875-.875s.3918-.875.875-.875.875.3917.875.875-.3918.875-.875.875Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default labelInfo;
