import React from 'react';

import type { iconProps } from './iconProps';

function hourglass(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hourglass';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,15h-.261c-.056-2.751-.457-4.593-1.989-6,1.532-1.407,1.932-3.249,1.989-6h.261c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.261c.056,2.751,.457,4.593,1.989,6-1.532,1.407-1.932,3.249-1.989,6h-.261c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hourglass;
