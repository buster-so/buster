import React from 'react';

import type { iconProps } from './iconProps';

function arrowDoorOut2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow door out 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.78,5.47l-2.25-2.25c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l.97.97h-2.689c-.414,0-.75.336-.75.75s.336.75.75.75h2.689l-.97.97c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2.25-2.25c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.353,9.269c-.413-.075-.797.202-.867.61-.062.36-.372.621-.735.621h-2.929l1.049-.874c.4-.333.63-.823.63-1.344V3.718c0-.521-.229-1.011-.63-1.344l-1.049-.874h2.929c.363,0,.673.261.735.621.071.408.458.685.867.61.408-.071.682-.459.61-.867-.188-1.08-1.118-1.864-2.213-1.864h-3.5C1.009,0,0,1.009,0,2.25v7.5c0,1.241,1.009,2.25,2.25,2.25h3.5c1.095,0,2.025-.784,2.213-1.864.071-.408-.202-.796-.61-.867Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowDoorOut2;
