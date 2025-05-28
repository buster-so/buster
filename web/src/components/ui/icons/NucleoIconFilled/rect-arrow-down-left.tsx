import React from 'react';

import type { iconProps } from './iconProps';

function rectArrowDownLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rect arrow down left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-4.47,6.28l-3.22,3.22h1.689c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-3.5c-.414,0-.75-.336-.75-.75v-3.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.689l3.22-3.22c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default rectArrowDownLeft;
