import React from 'react';

import type { iconProps } from './iconProps';

function check2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px check 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.5,14c-.192,0-.384-.073-.53-.22l-3.75-3.75c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.22,3.22L14.72,3.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L7.03,13.78c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default check2;
