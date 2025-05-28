import React from 'react';

import type { iconProps } from './iconProps';

function pinLink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin link';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="8"
          cy="7.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.086,9.75c.42-.893,.693-1.751,.693-2.484,0-3.491-2.987-5.516-5.779-5.516S2.221,3.776,2.221,7.266c0,2.623,3.428,6.833,5.004,8.631,.334,.38,.864,.438,1.276,.203"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,16.25h-.5c-.828,0-1.5-.672-1.5-1.5v-1c0-.828,.672-1.5,1.5-1.5h.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,16.25h.5c.828,0,1.5-.672,1.5-1.5v-1c0-.828-.672-1.5-1.5-1.5h-.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 14.25L14.75 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default pinLink;
