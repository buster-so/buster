import React from 'react';

import type { iconProps } from './iconProps';

function sidebarRight3Hide(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sidebar right 3 hide';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,16H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75ZM2.5,4.75c0-.689,.561-1.25,1.25-1.25h7.25v1.568l2.341,2.341c.425,.425,.659,.99,.659,1.591s-.234,1.166-.659,1.591l-2.341,2.341v1.568H3.75c-.689,0-1.25-.561-1.25-1.25V4.75Z"
          fill="currentColor"
        />
        <path
          d="M5.25,9.75h4.689l-1.22,1.22c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l2.5-2.5c.293-.293,.293-.768,0-1.061l-2.5-2.5c-.146-.146-.338-.22-.53-.22s-.384,.073-.53,.22c-.293,.293-.293,.768,0,1.061l1.22,1.22H5.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sidebarRight3Hide;
