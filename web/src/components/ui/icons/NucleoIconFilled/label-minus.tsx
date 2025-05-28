import React from 'react';

import type { iconProps } from './iconProps';

function labelMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.75,12h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M11.75,15c-1.24,0-2.25-1.009-2.25-2.25s1.01-2.25,2.25-2.25h3.25v-3.112c0-.775-.33-1.519-.905-2.04l-3.921-3.547c-.668-.605-1.68-.605-2.348,0l-3.921,3.547h0c-.574,.521-.904,1.264-.904,2.04v6.862c0,1.517,1.233,2.75,2.75,2.75h6.5c1.255,0,2.304-.849,2.633-2h-3.133ZM7.75,6.75c0-.689,.561-1.25,1.25-1.25s1.25,.561,1.25,1.25-.561,1.25-1.25,1.25-1.25-.561-1.25-1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default labelMinus;
