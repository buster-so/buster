import React from 'react';

import type { iconProps } from './iconProps';

function tableColsPlus2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table cols plus 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.5,2h-1.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h1.75V2Z"
          fill="currentColor"
        />
        <path
          d="M9.5,14.75c0-.977,.629-1.801,1.5-2.112V2H7v14h2.881c-.24-.358-.381-.788-.381-1.25Z"
          fill="currentColor"
        />
        <path
          d="M14.25,10c1.241,0,2.25,1.009,2.25,2.25v.25h.25c.086,0,.167,.016,.25,.025V4.75c0-1.517-1.233-2.75-2.75-2.75h-1.75V10.853c.413-.516,1.04-.853,1.75-.853Z"
          fill="currentColor"
        />
        <path
          d="M16.75,14h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableColsPlus2;
