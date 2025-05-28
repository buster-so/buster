import React from 'react';

import type { iconProps } from './iconProps';

function arrowBackToBottomRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow back to bottom right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.742,14H4.25c-1.517,0-2.75-1.233-2.75-2.75V5.75c0-1.517,1.233-2.75,2.75-2.75H13.75c1.517,0,2.75,1.233,2.75,2.75v3c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3c0-.689-.561-1.25-1.25-1.25H4.25c-.689,0-1.25,.561-1.25,1.25v5.5c0,.689,.561,1.25,1.25,1.25H13.742c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.25,16.985c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.462-2.462-2.462-2.462c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.992,2.992c.293,.293,.293,.768,0,1.061l-2.992,2.993c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowBackToBottomRight;
