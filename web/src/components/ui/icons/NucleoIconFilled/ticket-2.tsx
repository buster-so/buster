import React from 'react';

import type { iconProps } from './iconProps';

function ticket2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ticket 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,7.5c.414,0,.75-.336,.75-.75v-1c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v1c0,.414,.336,.75,.75,.75,.827,0,1.5,.673,1.5,1.5s-.673,1.5-1.5,1.5c-.414,0-.75,.336-.75,.75v1c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-1c0-.414-.336-.75-.75-.75-.827,0-1.5-.673-1.5-1.5s.673-1.5,1.5-1.5Zm-5,5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm0-2.875c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm0-2.625c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default ticket2;
