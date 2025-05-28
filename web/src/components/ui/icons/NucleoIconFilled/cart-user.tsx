import React from 'react';

import type { iconProps } from './iconProps';

function cartUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cart user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="14.25" cy="15.75" fill="currentColor" r="1.25" />
        <circle cx="3.75" cy="15.75" fill="currentColor" r="1.25" />
        <circle cx="14.641" cy="1.75" fill="currentColor" r="1.75" />
        <path
          d="M15.25,12.5H4.5c-.276,0-.5-.224-.5-.5s.224-.5,.5-.5H13.029c.754,0,1.421-.48,1.66-1.196l.268-.804h-2.417c-.892,0-1.733-.435-2.251-1.164-.513-.722-.646-1.651-.355-2.485,.249-.715,.66-1.336,1.17-1.852H4.765l-.176-1.196c-.103-.704-.616-1.271-1.307-1.444l-1.351-.337c-.403-.1-.809,.144-.909,.546-.101,.402,.144,.809,.546,.909l1.35,.337c.099,.025,.172,.105,.187,.207l1.032,7.015c-.93,.172-1.637,.985-1.637,1.963,0,1.103,.897,2,2,2H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.641,4c-1.48,0-2.802,.943-3.291,2.345-.131,.375-.07,.795,.162,1.123,.237,.333,.621,.532,1.028,.532h4.202c.407,0,.791-.199,1.027-.532,.232-.328,.293-.748,.163-1.123-.489-1.403-1.811-2.346-3.291-2.346Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cartUser;
