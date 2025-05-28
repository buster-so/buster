import React from 'react';

import type { iconProps } from './iconProps';

function split(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px split';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.838,5.5h5.412v-1.5h-5.412c-.937,0-1.8,.47-2.309,1.256l-1.937,2.994H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.842l1.937,2.994c.509,.787,1.372,1.256,2.309,1.256h5.412v-1.5h-5.412c-.426,0-.818-.213-1.049-.571l-1.895-2.929,1.895-2.929c.231-.357,.624-.571,1.049-.571Z"
          fill="currentColor"
        />
        <path
          d="M12.5,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.22-2.22-2.22-2.22c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.75,2.75c.293,.293,.293,.768,0,1.061l-2.75,2.75c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M12.5,8.25c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.22-2.22-2.22-2.22c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.75,2.75c.293,.293,.293,.768,0,1.061l-2.75,2.75c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default split;
