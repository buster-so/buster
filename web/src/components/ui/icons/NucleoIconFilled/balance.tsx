import React from 'react';

import type { iconProps } from './iconProps';

function balance(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px balance';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1ZM2.5,9c0-2.019,.925-3.825,2.373-5.018-.149,.44-.248,.903-.248,1.393,0,2.413,1.962,4.375,4.375,4.375,1.585,0,2.875,1.29,2.875,2.875s-1.29,2.875-2.875,2.875c-3.584,0-6.5-2.916-6.5-6.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default balance;
