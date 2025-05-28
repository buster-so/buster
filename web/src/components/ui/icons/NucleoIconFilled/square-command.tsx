import React from 'react';

import type { iconProps } from './iconProps';

function squareCommand(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square command';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6,11.5c0,.276,.224,.5,.5,.5s.5-.224,.5-.5v-.5h-.5c-.276,0-.5,.224-.5,.5Z"
          fill="currentColor"
        />
        <path
          d="M7,6.5c0-.276-.224-.5-.5-.5s-.5,.224-.5,.5,.224,.5,.5,.5h.5v-.5Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-1.75,7.5c1.103,0,2,.897,2,2s-.897,2-2,2-2-.897-2-2v-.5h-1v.5c0,1.103-.897,2-2,2s-2-.897-2-2,.897-2,2-2h.5v-1h-.5c-1.103,0-2-.897-2-2s.897-2,2-2,2,.897,2,2v.5h1v-.5c0-1.103,.897-2,2-2s2,.897,2,2-.897,2-2,2h-.5v1h.5Z"
          fill="currentColor"
        />
        <path
          d="M12,6.5c0-.276-.224-.5-.5-.5s-.5,.224-.5,.5v.5h.5c.276,0,.5-.224,.5-.5Z"
          fill="currentColor"
        />
        <path
          d="M11,11.5c0,.276,.224,.5,.5,.5s.5-.224,.5-.5-.224-.5-.5-.5h-.5v.5Z"
          fill="currentColor"
        />
        <path d="M8.5 8.5H9.5V9.5H8.5z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default squareCommand;
