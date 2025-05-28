import React from 'react';

import type { iconProps } from './iconProps';

function lockCircle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lock circle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,8.379c-.414,0-.75-.336-.75-.75v-3.129c0-1.103-.897-2-2-2s-2,.897-2,2v3.127c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3.127c0-1.93,1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5v3.129c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,6c-3.033,0-5.5,2.467-5.5,5.5s2.467,5.5,5.5,5.5,5.5-2.467,5.5-5.5-2.467-5.5-5.5-5.5Zm.75,6c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default lockCircle;
