import React from 'react';

import type { iconProps } from './iconProps';

function messageUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px message user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="14.141" cy="9.75" fill="currentColor" r="1.75" />
        <path
          d="M16.94,11.372c.014,.01,.031,.017,.045,.027,.003-.045,.013-.089,.014-.135-.019,.036-.038,.072-.058,.107Z"
          fill="currentColor"
        />
        <path
          d="M9.434,13.852c.361-1.035,1.043-1.89,1.908-2.479-.279-.479-.451-1.029-.451-1.622,0-1.792,1.458-3.25,3.25-3.25,1.243,0,2.313,.71,2.859,1.738v-3.988c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v7c0,1.517,1.233,2.75,2.75,2.75h1.25v2.25c0,.288,.165,.551,.425,.676,.103,.05,.214,.074,.325,.074,.167,0,.333-.056,.469-.165l3.106-2.485c.025-.168,.052-.336,.109-.499Z"
          fill="currentColor"
        />
        <path
          d="M14.141,12c-1.48,0-2.802,.943-3.291,2.345-.131,.375-.07,.795,.162,1.123,.237,.333,.621,.532,1.028,.532h4.202c.407,0,.791-.199,1.027-.532,.232-.328,.293-.748,.163-1.123-.489-1.403-1.811-2.346-3.291-2.346Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default messageUser;
