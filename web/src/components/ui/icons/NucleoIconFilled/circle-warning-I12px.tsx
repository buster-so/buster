import React from 'react';

import type { iconProps } from './iconProps';

function circleWarning(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle warning';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-.75,4.431c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.139c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V5.431Zm.75,7.986c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleWarning;
