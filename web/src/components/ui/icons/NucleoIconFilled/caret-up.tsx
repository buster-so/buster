import React from 'react';

import type { iconProps } from './iconProps';

function caretUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.248,2.52c-.559-.837-1.938-.837-2.496,0L1.653,7.168c-.308.461-.336,1.051-.074,1.54.262.489.769.792,1.322.792h6.197c.554,0,1.061-.303,1.322-.792.262-.488.233-1.079-.074-1.54l-3.099-4.648Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default caretUp;
