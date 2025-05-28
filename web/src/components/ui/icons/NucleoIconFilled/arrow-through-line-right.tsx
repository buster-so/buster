import React from 'react';

import type { iconProps } from './iconProps';

function arrowThroughLineRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow through line right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,16c-.414,0-.75-.336-.75-.75v-3.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M8.25,9.75c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.28,4.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.22,2.22H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.439l-2.22,2.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.5-3.5c.293-.293,.293-.768,0-1.061l-3.5-3.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowThroughLineRight;
