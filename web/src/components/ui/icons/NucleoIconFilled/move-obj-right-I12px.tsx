import React from 'react';

import type { iconProps } from './iconProps';

function moveObjRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px move obj right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.03,5.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.97,1.97h-5.689c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5.689l-1.97,1.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.25-3.25c.293-.293,.293-.768,0-1.061l-3.25-3.25Z"
          fill="currentColor"
        />
        <rect height="14" width="4.5" fill="currentColor" rx="1.75" ry="1.75" x="1.5" y="2" />
      </g>
    </svg>
  );
}

export default moveObjRight;
