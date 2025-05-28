import React from 'react';

import type { iconProps } from './iconProps';

function download3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px download 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.25,3h-2.5v3.939l.97-.97c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-2.25,2.25c-.146.146-.338.22-.53.22s-.384-.073-.53-.22l-2.25-2.25c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l.97.97v-3.939h-2.5c-1.517,0-2.75,1.233-2.75,2.75v3.5c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75v-3.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.75,3V.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v2.25h1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default download3;
