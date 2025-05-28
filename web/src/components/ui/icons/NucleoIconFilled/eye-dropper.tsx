import React from 'react';

import type { iconProps } from './iconProps';

function eyeDropper(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px eye dropper';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.905,5.345c-.293-.293-.768-.293-1.061,0l-4.142,4.142c-.313.313-.81.318-1.139.033-.013-.016-.019-.035-.033-.05-.015-.015-.034-.02-.05-.033-.285-.33-.28-.826.033-1.139l4.142-4.142c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0L1.453,7.237c-.726.726-.865,1.81-.435,2.685l-.798.798c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l.798-.798c.325.16.676.249,1.03.249.6,0,1.199-.229,1.655-.685l4.142-4.142c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.054.946C10.141.033,8.656.033,7.743.946l-1.618,1.618-.595-.595c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l4.5,4.5c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-.595-.595,1.618-1.618c.913-.913.913-2.398,0-3.311Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default eyeDropper;
