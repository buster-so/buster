import React from 'react';

import type { iconProps } from './iconProps';

function doubleChevronDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px double chevron down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.72,9.22l-3.72,3.72-3.72-3.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l4.25,4.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l4.25-4.25c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M12.72,4.47l-3.72,3.72-3.72-3.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l4.25,4.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l4.25-4.25c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default doubleChevronDown;
