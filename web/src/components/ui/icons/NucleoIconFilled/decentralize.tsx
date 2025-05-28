import React from 'react';

import type { iconProps } from './iconProps';

function decentralize(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px decentralize';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="6.5" fill="currentColor" r="2.5" />
        <path
          d="M9.75,12.899v-2.149c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.149c-.732,.298-1.25,1.014-1.25,1.851,0,1.103,.897,2,2,2s2-.897,2-2c0-.837-.518-1.554-1.25-1.851Z"
          fill="currentColor"
        />
        <path
          d="M13.75,7.25c.414,0,.75-.336,.75-.75,0-3.033-2.467-5.5-5.5-5.5S3.5,3.467,3.5,6.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-2.206,1.794-4,4-4s4,1.794,4,4c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M4.989,8.064l-1.168,.711c-.814,.496-1.32,1.396-1.32,2.349v.775c-.732,.298-1.25,1.014-1.25,1.851,0,1.103,.897,2,2,2s2-.897,2-2c0-.837-.518-1.554-1.25-1.851v-.775c0-.434,.23-.843,.6-1.068l1.168-.711c.354-.215,.466-.677,.251-1.03-.215-.354-.676-.466-1.03-.251Z"
          fill="currentColor"
        />
        <path
          d="M15.5,11.899v-.775c0-.954-.506-1.854-1.32-2.349l-1.168-.711c-.351-.215-.814-.104-1.03,.251-.215,.354-.103,.815,.251,1.03l1.168,.711c.37,.225,.6,.634,.6,1.068v.775c-.732,.298-1.25,1.014-1.25,1.851,0,1.103,.897,2,2,2s2-.897,2-2c0-.837-.518-1.554-1.25-1.851Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default decentralize;
