import React from 'react';

import type { iconProps } from './iconProps';

function chartPie(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart pie';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,12c-3.309,0-6-2.691-6-6C0,3.821,1.203,1.811,3.141.752c.361-.199.819-.065,1.018.299.199.363.065.819-.298,1.018-1.456.795-2.36,2.302-2.36,3.932,0,2.481,2.019,4.5,4.5,4.5,1.63,0,3.136-.904,3.932-2.36.199-.363.656-.498,1.018-.298.364.199.498.654.299,1.018-1.059,1.938-3.069,3.141-5.248,3.141Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,0c-.414,0-.75.336-.75.75v5.25c0,.414.336.75.75.75h5.25c.414,0,.75-.336.75-.75,0-3.309-2.691-6-6-6Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chartPie;
