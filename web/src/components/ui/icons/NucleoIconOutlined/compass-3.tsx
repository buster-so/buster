import React from 'react';

import type { iconProps } from './iconProps';

function compass3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px compass 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="9" cy="9" fill="currentColor" r="1" />
        <path
          d="M5.201,7.626l1.799-.626,.626-1.799-3.49-2.094c-.295-.177-.673-.13-.916,.113-.244,.243-.29,.621-.113,.916l2.094,3.49Z"
          fill="currentColor"
        />
        <path
          d="M10.374,5.201l.626,1.799,1.799,.626,2.094-3.49c.177-.295,.13-.673-.113-.916-.243-.244-.621-.29-.916-.113l-3.49,2.094Z"
          fill="currentColor"
        />
        <path
          d="M12.799,10.374l-1.799,.626-.626,1.799,3.49,2.094c.295,.177,.673,.13,.916-.113,.244-.243,.29-.621,.113-.916l-2.094-3.49Z"
          fill="currentColor"
        />
        <path
          d="M7.626,12.799l-.626-1.799-1.799-.626-2.094,3.49c-.177,.295-.13,.673,.113,.916,.243,.244,.621,.29,.916,.113l3.49-2.094Z"
          fill="currentColor"
        />
        <path
          d="M11 11L16.75 9 11 7 9 1.25 7 7 1.25 9 7 11 9 16.75 11 11z"
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

export default compass3;
