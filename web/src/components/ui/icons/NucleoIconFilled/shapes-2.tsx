import React from 'react';

import type { iconProps } from './iconProps';

function shapes2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shapes 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="2" y="2" />
        <circle cx="5" cy="13" fill="currentColor" r="3.25" />
        <path
          d="M15.5,12.25h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.083,2.201c-.451-.782-1.714-.783-2.165,0l-2.266,3.924c-.226,.392-.226,.859,0,1.25,.226,.392,.631,.625,1.083,.625h4.531c.452,0,.856-.233,1.083-.625,.226-.391,.226-.858,0-1.25l-2.266-3.924Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shapes2;
