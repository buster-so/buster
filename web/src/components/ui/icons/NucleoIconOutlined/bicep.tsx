import React from 'react';

import type { iconProps } from './iconProps';

function bicep(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bicep';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.224,5.671c-.753,3.106,1.082,3.424,1.824,5.197,1.046-1.239,4.63-2.647,6.938-1.463s2.555,4.431,.677,5.664c-1.107,.726-2.803,1.174-4.322,1.175-1.731,.044-2.98-.136-3.523-.408-.898,.115-2.795,.102-3.57-.687-.532-.541-1.618-3.646-.967-6.958,.691-3.496,1.844-6.44,3.089-6.44,.61,0,1.601,.02,2.064,.395s.249,1.196-.015,1.648c.323,.259,.392,.724,.159,1.066-.376,.428-.865,.741-1.411,.903-.313,.085-.686-.016-.942-.092Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75,13c1.438,.506,3.285,.129,4.5-.703"
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

export default bicep;
