import React from 'react';

import type { iconProps } from './iconProps';

function foodScale(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px food scale';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,1H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5.5v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.25h5.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M9,5.5c-3.309,0-6,2.691-6,6v2.75c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75v-2.75c0-3.309-2.691-6-6-6Zm0,9.5c-1.93,0-3.5-1.57-3.5-3.5s1.57-3.5,3.5-3.5,3.5,1.57,3.5,3.5-1.57,3.5-3.5,3.5Z"
          fill="currentColor"
        />
        <path
          d="M9,12c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default foodScale;
