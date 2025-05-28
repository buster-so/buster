import React from 'react';

import type { iconProps } from './iconProps';

function barcodeScan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px barcode scan';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.25,15c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7.75,12.75c-.414,0-.75-.336-.75-.75v-.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,15c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M1.75,15c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.25,3c-.414,0-.75,.336-.75,.75v5.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,3c-.414,0-.75,.336-.75,.75v5.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M1.75,3c-.414,0-.75,.336-.75,.75v5.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M7.75,3c-.414,0-.75,.336-.75,.75v5.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M17,9.75H1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H17c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <rect height="6.75" width="2.5" fill="currentColor" rx=".75" ry=".75" x="3.5" y="3" />
        <rect height="6.75" width="2.5" fill="currentColor" rx=".75" ry=".75" x="12" y="3" />
      </g>
    </svg>
  );
}

export default barcodeScan;
