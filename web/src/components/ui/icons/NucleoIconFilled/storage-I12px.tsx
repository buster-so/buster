import React from 'react';

import type { iconProps } from './iconProps';

function storage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px storage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <ellipse cx="9" cy="5.5" fill="currentColor" rx="7" ry="4" />
        <path
          d="M15.382,8.716c-.399-.104-.811,.134-.915,.536-.282,1.081-2.452,2.248-5.467,2.248s-5.185-1.167-5.467-2.248c-.104-.401-.516-.637-.915-.536-.4,.104-.641,.514-.536,.915,.51,1.952,3.419,3.369,6.918,3.369s6.408-1.417,6.918-3.369c.104-.401-.136-.811-.536-.915Z"
          fill="currentColor"
        />
        <path
          d="M15.382,12.216c-.399-.106-.811,.134-.915,.536-.282,1.081-2.452,2.248-5.467,2.248s-5.185-1.167-5.467-2.248c-.104-.401-.516-.639-.915-.536-.4,.104-.641,.514-.536,.915,.51,1.952,3.419,3.369,6.918,3.369s6.408-1.417,6.918-3.369c.104-.401-.136-.811-.536-.915Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default storage;
