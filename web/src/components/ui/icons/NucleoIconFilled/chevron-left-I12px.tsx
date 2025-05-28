import React from 'react';

import type { iconProps } from './iconProps';

function chevronLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chevron left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.5,16c-.192,0-.384-.073-.53-.22l-6.25-6.25c-.293-.293-.293-.768,0-1.061L10.97,2.22c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-5.72,5.72,5.72,5.72c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chevronLeft;
