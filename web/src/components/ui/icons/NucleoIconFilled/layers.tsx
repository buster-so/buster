import React from 'react';

import type { iconProps } from './iconProps';

function layers(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px layers';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.877,3.154L6.79.717s0,0,0,0c-.486-.289-1.09-.29-1.578,0L1.124,3.154c-.391.232-.624.642-.624,1.096s.233.863.623,1.096l4.088,2.438c.243.145.516.217.789.217s.546-.073.79-.218l4.087-2.437c.391-.232.624-.642.624-1.096s-.233-.863-.623-1.096Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,11.5c-.273,0-.545-.073-.789-.217l-4.088-2.438c-.39-.232-.623-.642-.623-1.096s.233-.863.624-1.096c.355-.211.816-.096,1.028.26.151.252.136.558-.013.79l3.841,2.29,3.882-2.291c-.148-.232-.164-.537-.013-.789.212-.356.673-.472,1.028-.26.391.232.624.642.624,1.096s-.233.863-.624,1.096l-4.087,2.437c-.244.145-.517.217-.79.218Zm4.109-3.558h.01-.01Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default layers;
