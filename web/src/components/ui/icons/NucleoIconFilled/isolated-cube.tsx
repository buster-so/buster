import React from 'react';

import type { iconProps } from './iconProps';

function isolatedCube(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px isolated cube';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="2" cy="2" fill="currentColor" r="1" />
        <circle cx="16" cy="2" fill="currentColor" r="1" />
        <circle cx="2" cy="16" fill="currentColor" r="1" />
        <circle cx="16" cy="16" fill="currentColor" r="1" />
        <path
          d="M15,6.923c0-.427-.115-.839-.32-1.2-.003-.004-.002-.01-.005-.014-.004-.006-.01-.009-.014-.015-.209-.355-.505-.66-.872-.873l-3.57-2.07c-.752-.436-1.686-.436-2.438,0l-3.571,2.071c-.367,.213-.663,.518-.872,.874-.003,.006-.009,.008-.013,.014-.002,.004-.002,.009-.004,.013-.206,.361-.321,.774-.321,1.201v4.154c0,.863,.464,1.668,1.211,2.103l3.57,2.07c.372,.215,.788,.323,1.205,.325,.005,0,.009,.003,.014,.003s.009-.003,.014-.003c.417-.002,.833-.11,1.205-.325l3.571-2.071c.746-.434,1.21-1.239,1.21-2.102V6.923ZM4.964,11.882c-.286-.166-.464-.475-.464-.805v-3.82l3.75,2.175v4.356l-3.286-1.906Zm8.073,0l-3.287,1.906v-4.356l3.75-2.175v3.82c0,.331-.178,.639-.463,.805Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default isolatedCube;
