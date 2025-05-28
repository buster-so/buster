import React from 'react';

import type { iconProps } from './iconProps';

function arrowThroughLineLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow through line left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.75,16c-.414,0-.75-.336-.75-.75v-3.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.75,9.75c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,8.25H4.561l2.22-2.22c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-3.5,3.5c-.293,.293-.293,.768,0,1.061l3.5,3.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.22-2.22H15.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowThroughLineLeft;
