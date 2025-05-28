import React from 'react';

import type { iconProps } from './iconProps';

function hand2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15,3.25c-.552,0-1,.448-1,1v3.25c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5V2.75c0-.552-.448-1-1-1s-1,.448-1,1V7.5c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5V1.5c0-.552-.448-1-1-1s-1,.448-1,1V7.5c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5V2.75c0-.552-.448-1-1-1s-1,.448-1,1v7.833l-1.688-2.021c-.426-.543-1.215-.635-1.755-.211-.54,.424-.604,1.131-.211,1.755l1.603,2.392c1.273,1.751,2.175,4.501,6.05,4.501h2c2.761,0,5-2.239,5-5V4.25c0-.552-.448-1-1-1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hand2;
