import React from 'react';

import type { iconProps } from './iconProps';

function texture(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px texture';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,16c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L14.72,2.22c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L3.28,15.78c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M2.75,11c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L9.72,2.22c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L3.28,10.78c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M2.75,6c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.5-2.5c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.5,2.5c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M7.75,16c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l7.5-7.5c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-7.5,7.5c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M12.75,16c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.5-2.5c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.5,2.5c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default texture;
