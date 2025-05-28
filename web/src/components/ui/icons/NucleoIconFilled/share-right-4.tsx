import React from 'react';

import type { iconProps } from './iconProps';

function shareRight4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share right 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,14.5H4.75c-.689,0-1.25-.561-1.25-1.25v-2.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.5c0,1.517,1.233,2.75,2.75,2.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M12.53,2.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.97,1.97h-2.439c-2.757,0-5,2.243-5,5,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-1.93,1.57-3.5,3.5-3.5h2.439l-1.97,1.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.25-3.25c.293-.293,.293-.768,0-1.061l-3.25-3.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shareRight4;
