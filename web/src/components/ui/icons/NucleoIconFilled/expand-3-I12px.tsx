import React from 'react';

import type { iconProps } from './iconProps';

function expand3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px expand 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2h-3.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.25c.689,0,1.25,.561,1.25,1.25v3.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.25c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M8,14.5h-3.25c-.689,0-1.25-.561-1.25-1.25v-3.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.25c0,1.517,1.233,2.75,2.75,2.75h3.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,7.75c.414,0,.75-.336,.75-.75v-2.439l2.97,2.97c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.97-2.97h2.439c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.75c-.414,0-.75,.336-.75,.75V7c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,10.25c-.414,0-.75,.336-.75,.75v2.439l-2.97-2.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.97,2.97h-2.439c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.25c.414,0,.75-.336,.75-.75v-4.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default expand3;
