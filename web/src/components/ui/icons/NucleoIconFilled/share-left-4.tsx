import React from 'react';

import type { iconProps } from './iconProps';

function shareLeft4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share left 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,10c-.414,0-.75,.336-.75,.75v2.5c0,.689-.561,1.25-1.25,1.25H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.25c1.517,0,2.75-1.233,2.75-2.75v-2.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M5.47,9.78c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.97-1.97h2.439c1.93,0,3.5,1.57,3.5,3.5,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-2.757-2.243-5-5-5h-2.439l1.97-1.97c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-3.25,3.25c-.293,.293-.293,.768,0,1.061l3.25,3.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shareLeft4;
