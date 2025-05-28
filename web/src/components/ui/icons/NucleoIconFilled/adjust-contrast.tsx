import React from 'react';

import type { iconProps } from './iconProps';

function adjustContrast(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px adjust contrast';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,.75v10.5c2.899,0,5.25-2.351,5.25-5.25S8.899.75,6,.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,12c-3.309,0-6-2.691-6-6S2.691,0,6,0s6,2.691,6,6-2.691,6-6,6Zm0-10.5C3.519,1.5,1.5,3.519,1.5,6s2.019,4.5,4.5,4.5,4.5-2.019,4.5-4.5S8.481,1.5,6,1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default adjustContrast;
