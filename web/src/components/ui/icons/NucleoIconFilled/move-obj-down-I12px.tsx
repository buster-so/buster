import React from 'react';

import type { iconProps } from './iconProps';

function moveObjDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px move obj down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.72,11.97l-1.97,1.97v-5.689c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v5.689l-1.97-1.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3.25,3.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.25-3.25c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <rect height="4.5" width="14" fill="currentColor" rx="1.75" ry="1.75" x="2" y="1.5" />
      </g>
    </svg>
  );
}

export default moveObjDown;
