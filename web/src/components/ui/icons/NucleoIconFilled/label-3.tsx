import React from 'react';

import type { iconProps } from './iconProps';

function label3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px label 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.695,1.592c-.332-.376-.811-.592-1.312-.592H2.75C1.233,1,0,2.233,0,3.75v4.5c0,1.517,1.233,2.75,2.75,2.75h4.632c.502,0,.98-.216,1.312-.592l2.868-3.25c.583-.66.583-1.655,0-2.315l-2.868-3.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default label3;
