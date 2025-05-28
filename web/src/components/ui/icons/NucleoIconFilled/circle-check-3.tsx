import React from 'react';

import type { iconProps } from './iconProps';

function circleCheck3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle check 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm3.947,5.641c-1.859,1.382-3.435,3.29-4.683,5.669-.129,.247-.385,.402-.664,.402-.277,.003-.538-.157-.667-.407-.575-1.117-1.218-2.025-1.965-2.776-.292-.293-.291-.769,.003-1.061,.292-.292,.768-.292,1.061,.003,.573,.576,1.09,1.228,1.563,1.972,1.239-2.045,2.734-3.726,4.458-5.007,.332-.246,.802-.178,1.049,.155,.247,.332,.178,.802-.155,1.049Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleCheck3;
