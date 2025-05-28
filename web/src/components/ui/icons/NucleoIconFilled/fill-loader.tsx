import React from 'react';

import type { iconProps } from './iconProps';

function fillLoader(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px fill loader';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14,5H4C1.794,5,0,6.794,0,9s1.794,4,4,4H14c2.206,0,4-1.794,4-4s-1.794-4-4-4ZM4.5,9.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5Zm2.5,0c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5Zm2.5,0c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default fillLoader;
