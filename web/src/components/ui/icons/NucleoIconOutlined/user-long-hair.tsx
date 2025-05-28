import React from 'react';

import type { iconProps } from './iconProps';

function userLongHair(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user long hair';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.5,9h0c.276,0,.5,.224,.5,.5h0c0,1.38-1.12,2.5-2.5,2.5h0c-.276,0-.5-.224-.5-.5H1c0-1.38,1.12-2.5,2.5-2.5Z"
          fill="currentColor"
          transform="rotate(180 2.5 10.5)"
        />
        <path
          d="M14.5,9h0c1.38,0,2.5,1.12,2.5,2.5h0c0,.276-.224,.5-.5,.5h0c-1.38,0-2.5-1.12-2.5-2.5h0c0-.276,.224-.5,.5-.5Z"
          fill="currentColor"
        />
        <path
          d="M2.953,16c1.298-1.958,3.522-3.25,6.047-3.25s4.749,1.291,6.047,3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,6.5c0-2.071-1.679-3.75-3.75-3.75s-3.75,1.679-3.75,3.75c0,.085,.019,.165,.025,.249,1.555-.009,2.923-.811,3.725-2.02,.802,1.21,2.17,2.011,3.725,2.02,.006-.084,.025-.164,.025-.249Z"
          fill="currentColor"
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

export default userLongHair;
