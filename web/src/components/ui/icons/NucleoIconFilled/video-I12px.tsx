import React from 'react';

import type { iconProps } from './iconProps';

function video(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px video';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.386,5.019c-.385-.227-.848-.234-1.238-.019l-2.148,1.181v5.637l2.147,1.181c.19,.105,.397,.157,.604,.157,.219,0,.438-.059,.635-.175,.385-.228,.614-.63,.614-1.077V6.096c0-.447-.229-.849-.614-1.077Z"
          fill="currentColor"
        />
        <path
          d="M9.75,3H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h6c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75Zm-4.75,5c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default video;
