import React from 'react';

import type { iconProps } from './iconProps';

function eyeSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eye slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4.4147,13.583l2.4642-2.4631c-.5427-.5432-.8789-1.2927-.8789-2.1194,0-1.6543,1.3457-3,3-3,.8272,0,1.5772.3364,2.1204.8799l2.4646-2.4636c-1.2065-.812-2.7245-1.4172-4.585-1.4172-4.001,0-6.4404,2.791-7.5386,4.4551-.6182.9395-.6182,2.1514,0,3.0898.587.8911,1.5625,2.1028,2.9532,3.0386Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.2986,5.884l-3.3191,3.3186c-.1016,1.4907-1.2871,2.676-2.7777,2.7773l-2.6429,2.6426c.739.2339,1.549.3779,2.4411.3779,4.001,0,6.4404-2.791,7.5386-4.4551.6182-.9395.6182-2.1514,0-3.0898-.3059-.4644-.7203-1.0166-1.2399-1.5715Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293.768-.293,1.061,0s.293.768,0,1.061L2.53,16.53c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default eyeSlash;
