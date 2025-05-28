import React from 'react';

import type { iconProps } from './iconProps';

function flame(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px flame';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6.492.184c-.282-.245-.701-.245-.983,0-.174.151-4.258,3.733-4.258,7.071,0,2.617,2.131,4.745,4.75,4.745s4.75-2.128,4.75-4.745C10.75,3.917,6.666.334,6.492.184Zm-2.206,8.594c0-.99.995-2.228,1.714-2.963.719.736,1.714,1.973,1.714,2.963,0,.95-.769,1.722-1.714,1.722s-1.714-.772-1.714-1.722Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default flame;
