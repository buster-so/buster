import React from 'react';

import type { iconProps } from './iconProps';

function bathtube(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bathtube';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.25,9.5c-.414,0-.75-.336-.75-.75V4c0-1.654,1.346-3,3-3s3,1.346,3,3c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-.827-.673-1.5-1.5-1.5s-1.5,.673-1.5,1.5v4.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,8H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25v1.75c0,1.811,1.291,3.326,3,3.674v1.326c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.25h5v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.326c1.709-.349,3-1.863,3-3.674v-1.75h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bathtube;
