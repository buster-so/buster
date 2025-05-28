import React from 'react';

import type { iconProps } from './iconProps';

function starUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px star user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="13.25" cy="11.75" fill="currentColor" r="1.75" />
        <path
          d="M9.463,14.275c.292-.342,.619-.651,.988-.903-.279-.479-.451-1.029-.451-1.622,0-1.792,1.458-3.25,3.25-3.25,.714,0,1.369,.239,1.906,.631l1.617-1.576c.205-.199,.278-.498,.19-.769-.088-.271-.323-.469-.605-.51l-4.62-.671L9.672,1.418c-.252-.512-1.093-.512-1.345,0l-2.066,4.186-4.62,.671c-.282,.041-.517,.239-.605,.51-.088,.271-.015,.57,.19,.769l3.343,3.258-.79,4.601c-.048,.282,.067,.566,.298,.734,.231,.167,.538,.19,.79,.057l4.132-2.173,.463,.243Z"
          fill="currentColor"
        />
        <path
          d="M16.541,16.346c-.489-1.403-1.811-2.346-3.291-2.346s-2.802,.943-3.291,2.345c-.131,.375-.07,.795,.162,1.123,.237,.333,.621,.532,1.027,.532h4.202c.407,0,.791-.199,1.027-.532,.232-.328,.293-.748,.163-1.123Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default starUser;
