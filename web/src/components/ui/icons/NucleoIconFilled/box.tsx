import React from 'react';

import type { iconProps } from './iconProps';

function box(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px box';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.398,3.372l-1.46-2.504c-.312-.536-.892-.868-1.512-.868H3.574c-.62,0-1.199.333-1.512.868L.602,3.372c-.067.115-.102.245-.102.378v5c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75V3.75c0-.133-.035-.263-.102-.378ZM3.358,1.624c.044-.077.127-.124.216-.124h1.676v1.5h-2.694l.803-1.376Zm1.892,7.876h-2c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2c.414,0,.75.336.75.75s-.336.75-.75.75Zm1.5-6.5v-1.5h1.676c.088,0,.171.047.216.124l.803,1.376h-2.694Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default box;
