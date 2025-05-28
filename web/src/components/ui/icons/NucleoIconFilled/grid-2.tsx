import React from 'react';

import type { iconProps } from './iconProps';

function grid2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="2" y="10" />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="10" y="10" />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="2" y="2" />
        <path
          d="M16.005,3.763l-1.769-1.769c-.681-.68-1.791-.681-2.474,0l-1.769,1.769c-.681,.682-.681,1.792,0,2.474l1.769,1.769c.341,.34,.789,.511,1.237,.511s.896-.17,1.237-.511l1.769-1.769c.681-.682,.681-1.792,0-2.474,0,0,0,0,0,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default grid2;
