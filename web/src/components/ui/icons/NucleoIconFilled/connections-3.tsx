import React from 'react';

import type { iconProps } from './iconProps';

function connections3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px connections 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.47,7.523c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061L9.53,.962c-.293-.293-.768-.293-1.061,0l-2.75,2.75c-.293,.293-.293,.768,0,1.061l2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M7.522,8.47l-2.75-2.75c-.293-.293-.768-.293-1.061,0L.962,8.47c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M9.53,10.477c-.293-.293-.768-.293-1.061,0l-2.75,2.75c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061l-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M17.038,8.47l-2.75-2.75c-.293-.293-.768-.293-1.061,0l-2.75,2.75c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default connections3;
