import React from 'react';

import type { iconProps } from './iconProps';

function fileDownload(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px file download';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.428,2.867l-2.295-2.294c-.363-.364-.867-.573-1.382-.573h-3.001C2.233,0,1,1.233,1,2.75v2.353c.413-.516,1.04-.853,1.75-.853,1.24,0,2.25,1.009,2.25,2.25v.514c.507.056.976.28,1.341.646.877.877.877,2.305,0,3.182l-1.159,1.159h3.068c1.517,0,2.75-1.233,2.75-2.75v-5.001c0-.521-.203-1.012-.572-1.382Zm-3.428,1.133V1.585c.024.016.051.027.071.048,0,0,0,0,0,0l2.294,2.293c.021.021.032.049.049.073h-2.415Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.22,8.72l-.72.72v-2.939c0-.414-.336-.75-.75-.75s-.75.336-.75.75v2.939l-.72-.72c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l2,2c.146.146.338.22.53.22s.384-.073.53-.22l2-2c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default fileDownload;
