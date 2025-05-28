import React from 'react';

import type { iconProps } from './iconProps';

function conversion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px conversion';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4.25,11.75c-.192,0-.384-.073-.53-.22L.47,8.28c-.214-.214-.279-.537-.163-.817s.39-.463.693-.463h10c.414,0,.75.336.75.75s-.336.75-.75.75H2.811l1.97,1.97c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11,5H1c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h8.189l-1.97-1.97c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.25,3.25c.214.214.279.537.163.817s-.39.463-.693.463Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default conversion;
