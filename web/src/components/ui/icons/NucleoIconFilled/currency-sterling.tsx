import React from 'react';

import type { iconProps } from './iconProps';

function currencySterling(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px currency sterling';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.25,10.5H5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13,16H5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c.552,0,1-.449,1-1V5.75c0-2.068,1.683-3.75,3.75-3.75s3.75,1.682,3.75,3.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-1.241-1.01-2.25-2.25-2.25s-2.25,1.009-2.25,2.25v7.75c0,.355-.074,.694-.209,1h5.709c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default currencySterling;
