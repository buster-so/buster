import React from 'react';

import type { iconProps } from './iconProps';

function arrowThroughLineDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow through line down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,9h-3.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,9H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.97,11.22l-2.22,2.22V2.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V13.439l-2.22-2.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3.5,3.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.5-3.5c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowThroughLineDown;
