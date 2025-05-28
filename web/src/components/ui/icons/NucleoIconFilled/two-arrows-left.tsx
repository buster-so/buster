import React from 'react';

import type { iconProps } from './iconProps';

function twoArrowsLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px two arrows left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,5.5H4.561l1.72-1.72c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-3,3c-.293,.293-.293,.768,0,1.061l3,3c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.72-1.72H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,11.5h-6.189l1.72-1.72c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-3,3c-.293,.293-.293,.768,0,1.061l3,3c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.72-1.72h6.189c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default twoArrowsLeft;
