import React from 'react';

import type { iconProps } from './iconProps';

function deleteRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px delete right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.833,8.528l-3.95-4.88c-.334-.412-.83-.648-1.36-.648H4.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h7.773c.53,0,1.026-.236,1.36-.649l3.95-4.879c.223-.275,.223-.668,0-.943Zm-6.053,2.191c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-1.72-1.72-1.72,1.72c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l1.72-1.72-1.72-1.72c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.72,1.72,1.72-1.72c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-1.72,1.72,1.72,1.72Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default deleteRight;
