import React from 'react';

import type { iconProps } from './iconProps';

function signalOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px signal off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,15c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M5.75,15c-.414,0-.75-.336-.75-.75v-4c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,15c-.414,0-.75-.336-.75-.75V7.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.061,4.75l1.47-1.47c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.47,1.47-1.47-1.47c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.47,1.47-1.47,1.47c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.47-1.47,1.47,1.47c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.47-1.47Z"
          fill="currentColor"
        />
        <circle cx="12.25" cy="14.25" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="14.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default signalOff;
