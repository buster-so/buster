import React from 'react';

import type { iconProps } from './iconProps';

function listTodo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px list todo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.412,9.876l-2.877,3.74-.755-.755c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.359,1.359c.142,.141,.332,.22,.53,.22,.017,0,.032,0,.049-.001,.215-.014,.414-.12,.546-.291l3.397-4.417c.252-.329,.19-.799-.138-1.052-.329-.254-.798-.19-1.052,.137Z"
          fill="currentColor"
        />
        <path
          d="M16.25,4.5h-6c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,12h-6c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="1.5" y="2" />
      </g>
    </svg>
  );
}

export default listTodo;
