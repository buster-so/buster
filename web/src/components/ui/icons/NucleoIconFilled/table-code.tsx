import React from 'react';

import type { iconProps } from './iconProps';

function tableCode(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table code';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15,16.5c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l1.72-1.72-1.72-1.72c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.25,2.25c.293,.293,.293,.768,0,1.061l-2.25,2.25c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M12,16.5c-.192,0-.384-.073-.53-.22l-2.25-2.25c-.293-.293-.293-.768,0-1.061l2.25-2.25c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-1.72,1.72,1.72,1.72c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.519,1.231,2.75,2.75,2.75h3.218c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.468v-6.5H3.5v-1.5h3V3.5h1.5v3h6.5v2.273c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.519-1.231-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableCode;
