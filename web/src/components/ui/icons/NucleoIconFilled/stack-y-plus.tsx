import React from 'react';

import type { iconProps } from './iconProps';

function stackYPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stack y plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,2H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,16H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M12.75,3.5H5.25c-1.517,0-2.75,1.233-2.75,2.75v5.5c0,1.517,1.233,2.75,2.75,2.75h7.5c1.517,0,2.75-1.233,2.75-2.75V6.25c0-1.517-1.233-2.75-2.75-2.75Zm-1.75,6.25h-1.25v1.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.25h-1.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.25v-1.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.25h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default stackYPlus;
