import React from 'react';

import type { iconProps } from './iconProps';

function video2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px video 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.431,6.471c-.356-.231-.801-.266-1.189-.094l-1.8,.8c.026,.189,.058,.377,.058,.573v4.5c0,.196-.032,.384-.058,.573l1.8,.8c.163,.072,.336,.108,.508,.108,.238,0,.474-.068,.681-.202,.356-.231,.569-.624,.569-1.048V7.52c0-.425-.213-.817-.569-1.048Z"
          fill="currentColor"
        />
        <rect height="10" width="11" fill="currentColor" rx="2.75" ry="2.75" x="1" y="5" />
        <circle cx="4.25" cy="2" fill="currentColor" r="2" />
        <circle cx="9.25" cy="2.5" fill="currentColor" r="1.5" />
      </g>
    </svg>
  );
}

export default video2;
