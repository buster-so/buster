import React from 'react';

import type { iconProps } from './iconProps';

function chatBubbleClip(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble clip';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10,13.75v-2.5c0-1.93,1.57-3.5,3.5-3.5,1.276,0,2.388,.69,3,1.713V4.75c0-1.517-1.233-2.75-2.75-2.75H4.25c-1.517,0-2.75,1.233-2.75,2.75v11.5c0,.288,.165,.551,.425,.676,.104,.05,.215,.074,.325,.074,.167,0,.333-.056,.469-.165l3.544-2.835h3.763c-.005-.084-.025-.164-.025-.25Z"
          fill="currentColor"
        />
        <path
          d="M17.25,11c-.414,0-.75,.336-.75,.75v2c0,.965-.785,1.75-1.75,1.75s-1.75-.785-1.75-1.75v-2.5c0-.276,.225-.5,.5-.5s.5,.224,.5,.5v2c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2c0-1.103-.897-2-2-2s-2,.897-2,2v2.5c0,1.792,1.458,3.25,3.25,3.25s3.25-1.458,3.25-3.25v-2c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chatBubbleClip;
