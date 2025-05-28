import React from 'react';

import type { iconProps } from './iconProps';

function judge(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px judge';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="3.25" fill="currentColor" r="2.5" />
        <path
          d="M9,6.5c-2.481,0-4.5,2.019-4.5,4.5,0,.414,.336,.75,.75,.75h7.5c.414,0,.75-.336,.75-.75,0-2.481-2.019-4.5-4.5-4.5Z"
          fill="currentColor"
        />
        <path
          d="M15.25,11H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.25v4.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-4.75h7v4.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-4.75h1.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default judge;
