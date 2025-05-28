import React from 'react';

import type { iconProps } from './iconProps';

function checkboxChecked(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px checkbox checked';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75.5H3.25C1.733.5.5,1.733.5,3.25v5.5c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75V3.25c0-1.517-1.233-2.75-2.75-2.75Zm.103,3.95l-3.003,4c-.13.174-.33.282-.546.298-.018.001-.036.002-.053.002-.198,0-.389-.078-.53-.219l-1.503-1.5c-.293-.292-.294-.767,0-1.061.292-.294.767-.294,1.061,0l.892.89,2.485-3.31c.249-.331.72-.398,1.05-.149.332.249.398.719.149,1.05Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default checkboxChecked;
