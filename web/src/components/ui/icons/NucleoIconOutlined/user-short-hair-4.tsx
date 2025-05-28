import React from 'react';

import type { iconProps } from './iconProps';

function userShortHair4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user short hair 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.615,7.5c.088-.318,.135-.654,.135-1,0-2.071-1.679-3.75-3.75-3.75s-3.75,1.679-3.75,3.75c0,.346,.047,.682,.135,1h.381c-.009-.826,.659-1.5,1.484-1.5h3.5c.826,0,1.493,.674,1.484,1.5h.381Z"
          fill="currentColor"
          opacity=".3"
        />
        <path
          d="M2.953,16c1.298-1.958,3.522-3.25,6.047-3.25s4.749,1.291,6.047,3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="6.5"
          fill="none"
          r="3.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default userShortHair4;
