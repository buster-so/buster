import React from 'react';

import type { iconProps } from './iconProps';

function yogaMat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px yoga mat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,15.5H4.25c-1.792,0-3.25-1.458-3.25-3.25,0-.414,.336-.75,.75-.75s.75,.336,.75,.75c0,.965,.785,1.75,1.75,1.75H15.25c.138,0,.25-.112,.25-.25V5.25c0-.138-.112-.25-.25-.25h-5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.75c.965,0,1.75,.785,1.75,1.75V13.75c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
        <path
          d="M4.25,1.5c-1.792,0-3.25,1.458-3.25,3.25v7.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-.965,.785-1.75,1.75-1.75s1.75,.785,1.75,1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.792-1.458-3.25-3.25-3.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default yogaMat;
