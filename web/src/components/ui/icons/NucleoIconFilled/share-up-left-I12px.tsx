import React from 'react';

import type { iconProps } from './iconProps';

function shareUpLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share up left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,8.25c.414,0,.75-.336,.75-.75v-2.939l4.97,4.97c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061L4.561,3.5h2.939c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.75c-.414,0-.75,.336-.75,.75V7.5c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2h-2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.75c.689,0,1.25,.561,1.25,1.25V13.25c0,.689-.561,1.25-1.25,1.25H4.75c-.689,0-1.25-.561-1.25-1.25v-2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.75c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shareUpLeft;
