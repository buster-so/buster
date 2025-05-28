import React from 'react';

import type { iconProps } from './iconProps';

function bookOpen2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px book open 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,3.765L3.216,2.376h0c-.531-.147-1.087-.039-1.525,.295-.438,.334-.69,.841-.69,1.392V12.488c0,.785,.528,1.479,1.285,1.688l5.965,1.646V3.765Z"
          fill="currentColor"
        />
        <path
          d="M16.31,2.671c-.438-.333-.995-.442-1.526-.295l-5.034,1.389V15.821l5.966-1.646c.756-.209,1.284-.903,1.284-1.688V4.063c0-.551-.251-1.058-.69-1.392Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bookOpen2;
