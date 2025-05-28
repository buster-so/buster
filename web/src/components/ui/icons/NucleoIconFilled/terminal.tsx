import React from 'react';

import type { iconProps } from './iconProps';

function terminal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px terminal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,15c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l4.72-4.72L2.22,4.28c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l5.25,5.25c.293,.293,.293,.768,0,1.061L3.28,14.78c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M15.25,15h-5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default terminal;
