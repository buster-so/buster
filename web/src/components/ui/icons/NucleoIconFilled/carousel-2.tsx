import React from 'react';

import type { iconProps } from './iconProps';

function carousel2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px carousel 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.704,5.189c.381,.161,.821-.014,.985-.394,.163-.381-.014-.822-.394-.985l-1.053-.451c-.389-.166-.829-.126-1.181,.105-.353,.232-.562,.622-.562,1.043V13.492c0,.421,.21,.812,.562,1.043,.207,.137,.446,.207,.688,.207,.166,0,.334-.034,.493-.102l1.053-.451c.38-.163,.557-.604,.394-.985s-.604-.556-.985-.394l-.704,.302V4.887l.704,.302Z"
          fill="currentColor"
        />
        <path
          d="M16.938,3.465c-.35-.232-.791-.272-1.181-.105l-1.053,.451c-.38,.163-.557,.604-.394,.985s.604,.556,.985,.394l.704-.302V13.113l-.704-.302c-.383-.163-.822,.013-.985,.394s.014,.822,.394,.985l1.053,.451c.159,.068,.326,.102,.493,.102,.241,0,.48-.07,.688-.207,.353-.232,.562-.622,.562-1.043V4.508c0-.421-.21-.812-.562-1.043Z"
          fill="currentColor"
        />
        <rect height="14" width="9" fill="currentColor" rx="1.75" ry="1.75" x="4.5" y="2" />
      </g>
    </svg>
  );
}

export default carousel2;
