import React from 'react';

import type { iconProps } from './iconProps';

function gauge7(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gauge 7';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9,17c-4.4111,0-8-3.5889-8-8,0-1.1533.2412-2.2671.7158-3.3105.1719-.3779.6182-.5435.9932-.3721.377.1714.5439.6162.3721.9932-.3857.8472-.5811,1.752-.5811,2.6895,0,3.584,2.916,6.5,6.5,6.5s6.5-2.916,6.5-6.5-2.916-6.5-6.5-6.5c-.9385,0-1.8428.1953-2.6895.5806-.374.1719-.8203.0063-.9932-.3721-.1719-.377-.0049-.8218.3721-.9932,1.043-.4746,2.1562-.7153,3.3105-.7153,4.4111,0,8,3.5889,8,8s-3.5889,8-8,8Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9,6c-.5547,0-1.0682.1616-1.5144.425l-3.0725-3.0725c-.293-.293-.7676-.293-1.0605,0s-.293.7676,0,1.0605l3.0725,3.0725c-.2635.4463-.425.9597-.425,1.5144,0,1.6543,1.3457,3,3,3s3-1.3457,3-3-1.3457-3-3-3Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default gauge7;
