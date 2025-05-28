import React from 'react';

import type { iconProps } from './iconProps';

function userCrown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user crown';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.749,1.04c.016-.301-.15-.583-.421-.714-.271-.131-.596-.088-.822,.11l-1.342,1.174c-.094,.082-.234,.082-.328,0l-1.342-1.174c-.283-.247-.705-.247-.988,0l-1.342,1.174c-.094,.082-.234,.082-.328,0L5.494,.436c-.227-.198-.551-.24-.822-.11-.271,.132-.437,.413-.421,.714l.249,4.731v.729c0,2.481,2.019,4.5,4.5,4.5s4.5-2.019,4.5-4.5v-.729l.249-4.731Zm-4.749,8.46c-1.654,0-3-1.346-3-3v-.223c1.937-.684,4.063-.684,6,0v.223c0,1.654-1.346,3-3,3Z"
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

export default userCrown;
