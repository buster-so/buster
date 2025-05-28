import React from 'react';

import type { iconProps } from './iconProps';

function routeClosed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px route closed';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,9.75h-2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M3.25,9.75H1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H3.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,2.5c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5-2.916-6.5-6.5-6.5Zm2.78,8.22c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-1.72-1.72-1.72,1.72c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l1.72-1.72-1.72-1.72c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.72,1.72,1.72-1.72c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-1.72,1.72,1.72,1.72Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default routeClosed;
