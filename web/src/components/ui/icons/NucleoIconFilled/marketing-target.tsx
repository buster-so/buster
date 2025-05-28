import React from 'react';

import type { iconProps } from './iconProps';

function marketingTarget(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px marketing target';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m3.48,9.708c-.09,0-.181-.016-.27-.05-1.95-.75-3.211-2.579-3.211-4.658C0,2.243,2.243,0,5,0c2.079,0,3.907,1.26,4.658,3.21.148.387-.044.821-.431.97-.386.146-.82-.043-.97-.431-.525-1.367-1.805-2.25-3.258-2.25-1.93,0-3.5,1.57-3.5,3.5,0,1.454.883,2.732,2.25,3.258.387.149.579.583.431.969-.115.298-.399.481-.7.481Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.53,10.47l-1.834-1.834.935-.299c.517-.165.857-.622.869-1.165.011-.542-.311-1.014-.82-1.2l-4.891-1.787c-.463-.168-.965-.058-1.312.29-.349.348-.46.851-.291,1.313l1.786,4.89c.184.501.642.822,1.173.822.009,0,.019,0,.027,0,.543-.011,1-.352,1.164-.868l.3-.935,1.834,1.834c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default marketingTarget;
