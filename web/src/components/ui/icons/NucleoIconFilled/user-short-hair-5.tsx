import React from 'react';

import type { iconProps } from './iconProps';

function userShortHair5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user short hair 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,11c2.481,0,4.5-2.019,4.5-4.5v-.75c0-.997-.539-1.864-1.335-2.346,.513-.575,.835-1.324,.835-2.154,0-.414-.336-.75-.75-.75h-3c-2.619,0-4.75,2.131-4.75,4.75v1.25c0,2.481,2.019,4.5,4.5,4.5Zm0-1.5c-1.654,0-3-1.346-3-3v-.75c0-.689,.561-1.25,1.25-1.25h3.5c.689,0,1.25,.561,1.25,1.25v.75c0,1.654-1.346,3-3,3Z"
          fill="currentColor"
        />
        <path
          d="M15.2,14.957c-1.528-1.879-3.788-2.957-6.2-2.957s-4.672,1.078-6.2,2.957c-.306,.376-.365,.883-.156,1.323,.212,.444,.647,.72,1.137,.72H14.219c.49,0,.925-.276,1.137-.72,.209-.44,.15-.947-.156-1.323Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userShortHair5;
