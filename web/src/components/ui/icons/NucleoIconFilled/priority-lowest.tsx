import React from 'react';

import type { iconProps } from './iconProps';

function priorityLowest(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px priority lowest';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,15.75c-.192,0-.384-.073-.53-.22L2.22,9.28c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l5.72,5.72,5.72-5.72c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-6.25,6.25c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M9,10.75c-.192,0-.384-.073-.53-.22L2.22,4.28c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l5.72,5.72L14.72,3.22c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-6.25,6.25c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default priorityLowest;
