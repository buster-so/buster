import React from 'react';

import type { iconProps } from './iconProps';

function cloudPlay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud play';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.146,6.327c-.442-2.463-2.611-4.327-5.146-4.327-2.895,0-5.25,2.355-5.25,5.25,0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,2.068,1.682,3.75,3.75,3.75h7.75c2.481,0,4.5-2.019,4.5-4.5,0-1.854-1.15-3.503-2.854-4.173Zm-3.431,3.192l-2.307,1.385c-.403,.242-.916-.048-.916-.519v-2.771c0-.47,.513-.76,.916-.519l2.307,1.385c.391,.235,.391,.802,0,1.037Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloudPlay;
