import React from 'react';

import type { iconProps } from './iconProps';

function speaker(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px speaker';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,1H5.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75Zm-3.25,3.5c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Zm0,9c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5,2.5,1.119,2.5,2.5-1.119,2.5-2.5,2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default speaker;
