import React from 'react';

import type { iconProps } from './iconProps';

function circleOpenArrowUpRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle open arrow up right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9c0,1.936,.692,3.713,1.841,5.099l6.599-6.599h-2.689c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75v4.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.689L3.901,15.159c1.385,1.149,3.163,1.841,5.099,1.841,4.411,0,8-3.589,8-8S13.411,1,9,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleOpenArrowUpRight;
