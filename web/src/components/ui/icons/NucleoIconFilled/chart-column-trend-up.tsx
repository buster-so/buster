import React from 'react';

import type { iconProps } from './iconProps';

function chartColumnTrendUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart column trend up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,15.5c-.414,0-.75-.336-.75-.75v-3.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,15.5c-.414,0-.75-.336-.75-.75v-6.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7.25,15.5c-.414,0-.75-.336-.75-.75v-6.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.75,15.5c-.414,0-.75-.336-.75-.75v-3.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,8.5c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l3.646-3.646c.487-.487,1.28-.487,1.768,0l3.116,3.116,3.97-3.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-4.146,4.146c-.487,.487-1.28,.487-1.768,0l-3.116-3.116-3.47,3.47c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartColumnTrendUp;
