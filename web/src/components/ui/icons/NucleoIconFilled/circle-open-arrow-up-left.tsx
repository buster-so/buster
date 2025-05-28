import React from 'react';

import type { iconProps } from './iconProps';

function circleOpenArrowUpLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle open arrow up left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.5,8.561v2.689c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V6.75c0-.414,.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-2.689l6.599,6.598c1.149-1.385,1.841-3.162,1.841-5.098,0-4.411-3.589-8-8-8S1,4.589,1,9s3.589,8,8,8c1.936,0,3.713-.692,5.099-1.841l-6.599-6.598Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleOpenArrowUpLeft;
