import React from 'react';

import type { iconProps } from './iconProps';

function uTurnToDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px u turn to down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,16.25c-.414,0-.75-.336-.75-.75V6c0-1.654-1.346-3-3-3s-3,1.346-3,3v3.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3.75C3.5,3.519,5.519,1.5,8,1.5s4.5,2.019,4.5,4.5V15.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.75,16.5c-.192,0-.384-.073-.53-.22l-3.5-3.5c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.97,2.97,2.97-2.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-3.5,3.5c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default uTurnToDown;
