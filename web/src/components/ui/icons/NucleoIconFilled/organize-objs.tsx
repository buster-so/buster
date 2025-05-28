import React from 'react';

import type { iconProps } from './iconProps';

function organizeObjs(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px organize objs';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.72,12.22l-1.22,1.22V4.561l1.22,1.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.5-2.5c-.293-.293-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l1.22-1.22V13.439l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <rect height="6.5" width="6.5" fill="currentColor" rx="1.75" ry="1.75" x="2" y="9.5" />
        <rect height="6.5" width="6.5" fill="currentColor" rx="1.75" ry="1.75" x="2" y="2" />
      </g>
    </svg>
  );
}

export default organizeObjs;
