import React from 'react';

import type { iconProps } from './iconProps';

function codeCommit(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px code commit';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,9.75H1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H17c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <circle cx="9" cy="9" fill="currentColor" r="4" />
      </g>
    </svg>
  );
}

export default codeCommit;
