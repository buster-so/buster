import React from 'react';

import type { iconProps } from './iconProps';

function label(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px label';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.408,3.305L7.158.438c-.66-.582-1.655-.582-2.315,0L1.592,3.305c-.376.332-.592.811-.592,1.312v4.132c0,1.517,1.233,2.75,2.75,2.75h4.5c1.517,0,2.75-1.233,2.75-2.75v-4.132c0-.502-.216-.98-.592-1.312Zm-4.408,2.695c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default label;
