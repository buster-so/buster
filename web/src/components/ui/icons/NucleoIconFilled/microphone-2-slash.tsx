import React from 'react';

import type { iconProps } from './iconProps';

function microphone2Slash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px microphone 2 slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.25,7.5h6.25l3.586-3.586c-.824-2-2.792-3.414-5.086-3.414C5.968,.5,3.5,2.967,3.5,6v.75c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,9h-3.068l-6.119,6.119c.653,.416,1.387,.714,2.187,.824v1.057c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.057c2.678-.368,4.75-2.665,4.75-5.443h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,10.5h.75c0,1.133,.358,2.177,.948,3.052l4.552-4.552H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default microphone2Slash;
