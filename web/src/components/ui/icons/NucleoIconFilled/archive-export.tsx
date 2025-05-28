import React from 'react';

import type { iconProps } from './iconProps';

function archiveExport(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px archive export';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,2c-.414,0-.75.336-.75.75v3.25h-1.25c-.414,0-.75.336-.75.75v1.25h-4v-1.25c0-.414-.336-.75-.75-.75h-1.25v-3.25c0-.414-.336-.75-.75-.75s-.75.336-.75.75v6c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.78,2.47L6.53.22c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293.293-.293.768,0,1.061s.768.293,1.061,0l.97-.97v1.939c0,.414.336.75.75.75s.75-.336.75-.75v-1.939l.97.97c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default archiveExport;
