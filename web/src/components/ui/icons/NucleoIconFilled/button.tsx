import React from 'react';

import type { iconProps } from './iconProps';

function button(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px button';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.18,6.472l-4.891-1.787c-.463-.167-.965-.058-1.312.29-.349.348-.46.851-.291,1.313l1.786,4.89c.184.501.642.822,1.173.822.009,0,.019,0,.027,0,.543-.011,1-.352,1.164-.868l.558-1.738,1.737-.556c.517-.165.857-.622.869-1.165.011-.542-.311-1.014-.82-1.2Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.135,7.894c-.077,0-.155-.012-.232-.037-1.138-.37-1.902-1.418-1.902-2.607v-1.5C0,2.234,1.233,1,2.75,1h6.5c1.517,0,2.75,1.234,2.75,2.75v1.302c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-1.302c0-.689-.561-1.25-1.25-1.25H2.75c-.689,0-1.25.561-1.25,1.25v1.5c0,.538.349,1.012.867,1.18.394.128.609.551.48.945-.103.317-.396.518-.713.518Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default button;
