import React from 'react';

import type { iconProps } from './iconProps';

function sortTopToBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sort top to bottom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.28,10.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.97,.97h-.689c-2.206,0-4-1.794-4-4s1.794-4,4-4h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.75C3.467,3.5,1,5.967,1,9s2.467,5.5,5.5,5.5h.689l-.97,.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.25-2.25c.293-.293,.293-.768,0-1.061l-2.25-2.25Z"
          fill="currentColor"
        />
        <path
          d="M16.25,8.25h-4.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,13h-4.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,3.5h-4.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sortTopToBottom;
