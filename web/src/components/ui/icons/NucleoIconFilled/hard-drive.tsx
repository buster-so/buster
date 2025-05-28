import React from 'react';

import type { iconProps } from './iconProps';

function hardDrive(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hard drive';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.871,10.502l-2.204-6.621c-.375-1.125-1.423-1.881-2.609-1.881H5.942c-1.186,0-2.235,.756-2.609,1.881L1.129,10.502s-.129,.439-.129,.748v2c0,1.241,1.009,2.25,2.25,2.25H14.75c1.241,0,2.25-1.009,2.25-2.25v-2c0-.385-.129-.748-.129-.748Zm-1.371,2.748c0,.414-.336,.75-.75,.75H3.25c-.414,0-.75-.336-.75-.75v-2c0-.414,.336-.75,.75-.75H14.75c.414,0,.75,.336,.75,.75v2Z"
          fill="currentColor"
        />
        <path
          d="M7,11.5h-2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hardDrive;
