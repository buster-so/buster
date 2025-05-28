import React from 'react';

import type { iconProps } from './iconProps';

function files(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px files';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.25,14h-1c-1.517,0-2.75-1.233-2.75-2.75V3.25C1.5,1.733,2.733,.5,4.25,.5h5c1.517,0,2.75,1.233,2.75,2.75v1.052c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.052c0-.689-.561-1.25-1.25-1.25H4.25c-.689,0-1.25,.561-1.25,1.25V11.25c0,.689,.561,1.25,1.25,1.25h1c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.487,6.927l-2.914-2.914c-.331-.331-.77-.513-1.237-.513H7.25c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75h6c1.517,0,2.75-1.233,2.75-2.75v-6.086c0-.467-.182-.907-.513-1.237Zm-1.053,1.068l-.002,.005h-2.432c-.275,0-.5-.225-.5-.5v-2.432l.005-.002,2.929,2.929Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default files;
