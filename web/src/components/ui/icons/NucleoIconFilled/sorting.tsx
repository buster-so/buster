import React from 'react';

import type { iconProps } from './iconProps';

function sorting(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sorting';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,8.5h-6c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M9.25,7h4c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-4c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.25,4h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7.97,11.97l-1.47,1.47V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V13.439l-1.47-1.47c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sorting;
