import React from 'react';

import type { iconProps } from './iconProps';

function arrowToCornerTopRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow to corner top right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.25,7H4.74c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.7L2.22,14.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l6.22-6.22v3.7c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V7.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.25c.689,0,1.25,.561,1.25,1.25V14.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowToCornerTopRight;
