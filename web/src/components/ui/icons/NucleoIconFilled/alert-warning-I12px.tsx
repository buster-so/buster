import React from 'react';

import type { iconProps } from './iconProps';

function alertWarning(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px alert warning';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,11.5c.414,0,.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V10.75c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <circle cx="9" cy="15" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default alertWarning;
