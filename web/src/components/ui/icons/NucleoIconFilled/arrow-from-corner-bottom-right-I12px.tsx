import React from 'react';

import type { iconProps } from './iconProps';

function arrowFromCornerBottomRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow from corner bottom right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15,2.75c0-.414-.336-.75-.75-.75H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-.689,.561-1.25,1.25-1.25H14.25c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,8.99c-.414,0-.75,.336-.75,.75v3.7l-6.22-6.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l6.22,6.22h-3.7c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5.511c.414,0,.75-.336,.75-.75v-5.51c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowFromCornerBottomRight;
