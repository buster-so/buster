import React from 'react';

import type { iconProps } from './iconProps';

function userPanoramaView(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user panorama view';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m14.93,12.282c.65.223,1.32-.257,1.32-.945V2.75c0-.687-.67-1.168-1.32-.945-1.464.503-3.5.99-5.93.991-2.43-.002-4.467-.489-5.93-.991-.65-.223-1.32.257-1.32.945v8.587c0,.687.67,1.168,1.32.945"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.801,15.776c-.489-.148-.818-.635-.709-1.135.393-1.797,1.993-3.142,3.908-3.142s3.515,1.345,3.908,3.142c.109.499-.219.987-.709,1.135-.821.248-1.911.474-3.199.474s-2.378-.225-3.199-.474Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="7"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default userPanoramaView;
