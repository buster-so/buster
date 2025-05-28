import React from 'react';

import type { iconProps } from './iconProps';

function weightScale(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px weight scale';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm0,7.5c0,.276-.224,.5-.5,.5h-3.284l.949-1.917c.184-.371,.032-.821-.34-1.005-.371-.182-.821-.032-1.005,.34l-1.278,2.583h-2.542c-.276,0-.5-.224-.5-.5v-.25c0-2.343,1.907-4.25,4.25-4.25s4.25,1.907,4.25,4.25v.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default weightScale;
