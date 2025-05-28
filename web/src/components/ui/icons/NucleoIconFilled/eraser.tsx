import React from 'react';

import type { iconProps } from './iconProps';

function eraser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eraser';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16,16h-7.374c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.374c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.056,5.691l-3.712-3.713c-.851-.85-2.333-.848-3.182,0L1.944,9.197c-.425,.425-.659,.99-.659,1.591s.234,1.167,.659,1.591l3.401,3.402c.141,.141,.331,.22,.53,.22h2.743c.199,0,.39-.079,.53-.22l6.906-6.907c.425-.425,.659-.99,.659-1.591s-.234-1.167-.659-1.591Zm-7.747,8.809h-2.122l-3.182-3.183c-.142-.141-.22-.33-.22-.53s.078-.389,.22-.53l3.078-3.078,4.773,4.773-2.548,2.548Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default eraser;
