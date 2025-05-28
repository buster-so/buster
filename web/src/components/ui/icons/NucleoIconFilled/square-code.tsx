import React from 'react';

import type { iconProps } from './iconProps';

function squareCode(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square code';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14,7c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l1.72-1.72-1.72-1.72c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.25,2.25c.293,.293,.293,.768,0,1.061l-2.25,2.25c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M15.591,7.841c-.425,.425-.99,.659-1.591,.659h-3c-.601,0-1.166-.234-1.591-.659l-2.25-2.25c-.425-.425-.659-.99-.659-1.591s.234-1.166,.659-1.591l.409-.409h-2.818c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V7.432l-.409,.409Z"
          fill="currentColor"
        />
        <path
          d="M11,7c-.192,0-.384-.073-.53-.22l-2.25-2.25c-.293-.293-.293-.768,0-1.061l2.25-2.25c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-1.72,1.72,1.72,1.72c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareCode;
