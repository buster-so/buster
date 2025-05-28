import React from 'react';

import type { iconProps } from './iconProps';

function stackPerspective2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px stack perspective 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m5.956,11.205l-4.5-1.377c-.42-.128-.706-.514-.706-.951V3.995c0-.669.651-1.148,1.294-.951l4.5,1.377c.42.128.706.514.706.951v4.882c0,.669-.651,1.148-1.294.951Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.75,8.892l.206.063c.643.197,1.294-.281,1.294-.951V3.123c0-.437-.286-.822-.706-.951L6.044.795c-.484-.148-.972.087-1.184.497"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default stackPerspective2;
