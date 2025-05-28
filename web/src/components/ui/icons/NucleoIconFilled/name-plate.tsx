import React from 'react';

import type { iconProps } from './iconProps';

function namePlate(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px name plate';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,5c-.689,0-1.25-.561-1.25-1.25,0-.414-.336-.75-.75-.75H3.75c-.414,0-.75,.336-.75,.75,0,.689-.561,1.25-1.25,1.25-.414,0-.75,.336-.75,.75v6.5c0,.414,.336,.75,.75,.75,.689,0,1.25,.561,1.25,1.25,0,.414,.336,.75,.75,.75H14.25c.414,0,.75-.336,.75-.75,0-.689,.561-1.25,1.25-1.25,.414,0,.75-.336,.75-.75V5.75c0-.414-.336-.75-.75-.75Zm-4,6.5H5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm0-3H5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default namePlate;
