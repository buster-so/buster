import React from 'react';

import type { iconProps } from './iconProps';

function bucketPaint2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bucket paint 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1.5c-3.479,0-7,1.03-7,3,0,.094,.039,.351,.041,.361l1.209,9.089c0,1.752,2.98,2.55,5.75,2.55s5.75-.798,5.75-2.55l1.209-9.089c.002-.01,.041-.267,.041-.361,0-1.97-3.521-3-7-3Zm5.491,3.02c-.034,.307-.964,.887-2.686,1.221-.466,.09-.805,.503-.805,.978v3.282c0,.552-.448,1-1,1s-1-.448-1-1v-3.03c0-.528-.415-.966-.942-.995-2.925-.162-4.505-1.051-4.549-1.455l-.004-.031c.028-.441,1.948-1.489,5.495-1.489s5.467,1.048,5.495,1.489l-.004,.031Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bucketPaint2;
