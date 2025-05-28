import React from 'react';

import type { iconProps } from './iconProps';

function squareArrowUpLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square arrow up left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-.97,10.28c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-4.22-4.22v1.689c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3.5c0-.414,.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1.689l4.22,4.22c.293,.293,.293,.768,0,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareArrowUpLeft;
