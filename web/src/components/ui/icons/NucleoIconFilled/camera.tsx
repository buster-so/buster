import React from 'react';

import type { iconProps } from './iconProps';

function camera(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px camera';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,3h-1.73l-.324-.864c-.254-.68-.913-1.136-1.639-1.136h-3.114c-.726,0-1.384,.457-1.638,1.136l-.324,.864h-1.73c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75ZM4,7c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm5,5c-1.657,0-3-1.343-3-3s1.343-3,3-3,3,1.343,3,3-1.343,3-3,3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default camera;
