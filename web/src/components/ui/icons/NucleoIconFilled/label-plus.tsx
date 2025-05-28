import React from 'react';

import type { iconProps } from './iconProps';

function labelPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,15.25v-.25h-.25c-1.24,0-2.25-1.009-2.25-2.25s1.01-2.25,2.25-2.25h.25v-.25c0-1.241,1.01-2.25,2.25-2.25,.264,0,.514,.054,.75,.138v-.75c0-.775-.33-1.519-.905-2.04l-3.921-3.547c-.668-.605-1.68-.605-2.348,0l-3.921,3.547h0c-.574,.521-.904,1.264-.904,2.04v6.862c0,1.517,1.233,2.75,2.75,2.75h6.5c.184,0,.364-.02,.538-.054-.478-.413-.788-1.016-.788-1.696ZM7.75,6.75c0-.689,.561-1.25,1.25-1.25s1.25,.561,1.25,1.25-.561,1.25-1.25,1.25-1.25-.561-1.25-1.25Z"
          fill="currentColor"
        />
        <path
          d="M16.75,12h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default labelPlus;
