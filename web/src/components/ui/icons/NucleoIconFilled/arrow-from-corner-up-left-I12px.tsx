import React from 'react';

import type { iconProps } from './iconProps';

function arrowFromCornerUpLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow from corner up left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,3c-.414,0-.75,.336-.75,.75V13.25c0,.689-.561,1.25-1.25,1.25H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.25c1.517,0,2.75-1.233,2.75-2.75V3.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M3.5,8.26v-3.7l6.22,6.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061L4.561,3.5h3.7c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.75c-.414,0-.75,.336-.75,.75v5.51c0,.414,.336,.75,.75,.75s.75-.336,.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowFromCornerUpLeft;
