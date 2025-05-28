import React from 'react';

import type { iconProps } from './iconProps';

function arrowDottedRotateAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow dotted rotate anticlockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="6" cy="11.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="3.375" cy="10.547" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="1.453" cy="8.625" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="8.625" cy="10.547" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="10.547" cy="8.625" fill="currentColor" r=".75" strokeWidth="0" />
        <path
          d="m6,0c-1.517,0-2.922.565-4,1.534v-.784c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3c0,.414.336.75.75.75h3c.414,0,.75-.336.75-.75s-.336-.75-.75-.75h-1.606c.839-.944,2.045-1.5,3.356-1.5,2.481,0,4.5,2.019,4.5,4.5,0,.414.336.75.75.75s.75-.336.75-.75c0-3.309-2.691-6-6-6Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowDottedRotateAnticlockwise;
