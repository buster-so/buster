import React from 'react';

import type { iconProps } from './iconProps';

function userLaptop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user laptop';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="8" cy="5.5" fill="currentColor" r="4.5" />
        <path
          d="M8.75,11.75c0-.414-.336-.75-.75-.75-2.689,0-5.184,1.34-6.673,3.585-.229,.345-.135,.811,.21,1.04,.128,.084,.271,.125,.414,.125,.243,0,.481-.118,.626-.335,1.21-1.825,3.237-2.914,5.423-2.914,.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M17.529,11.57c-.231-.357-.623-.57-1.049-.57h-5.405c-.494,0-.942,.292-1.143,.742l-1.67,3.758h-2.512c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.925c.494,0,.942-.292,1.143-.742l1.555-3.499c.174-.388,.139-.833-.093-1.189Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userLaptop;
