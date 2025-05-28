import React from 'react';

import type { iconProps } from './iconProps';

function arrowTrendUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow trend up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.75,13c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l3.646-3.646c.487-.487,1.28-.487,1.768,0l3.116,3.116,5.72-5.72c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-5.896,5.896c-.487,.487-1.28,.487-1.768,0l-3.116-3.116-3.47,3.47c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M16.25,11.5c-.414,0-.75-.336-.75-.75V6.5h-4.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75v5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowTrendUp;
