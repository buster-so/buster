import React from 'react';

import type { iconProps } from './iconProps';

function subscript(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px subscript';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.073 3.75L10.427 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.073 14.25L10.427 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.938,12.905c.212-.754,.942-1.166,1.732-1.154,.789,.012,1.531,.365,1.578,1.154s-.789,1.319-1.655,1.673c-.866,.353-1.584,.683-1.655,1.673h3.312"
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

export default subscript;
