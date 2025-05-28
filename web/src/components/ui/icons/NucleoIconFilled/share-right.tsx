import React from 'react';

import type { iconProps } from './iconProps';

function shareRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,10c-.414,0-.75,.336-.75,.75v2.5c0,.689-.561,1.25-1.25,1.25H4.75c-.689,0-1.25-.561-1.25-1.25V5.75c0-.689,.561-1.25,1.25-1.25h3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-3.5c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75h7.5c1.517,0,2.75-1.233,2.75-2.75v-2.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M13.53,1.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.97,1.97h-1.689c-2.619,0-4.75,2.131-4.75,4.75,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-1.792,1.458-3.25,3.25-3.25h1.689l-1.97,1.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.25-3.25c.293-.293,.293-.768,0-1.061l-3.25-3.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shareRight;
