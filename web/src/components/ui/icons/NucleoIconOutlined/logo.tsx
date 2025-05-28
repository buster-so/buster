import React from 'react';

import type { iconProps } from './iconProps';

function logo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px logo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25,11.473V6.527c0-.713-.38-1.372-.997-1.73l-4.25-2.465c-.621-.36-1.386-.36-2.007,0L3.747,4.797c-.617,.358-.997,1.017-.997,1.73v4.946c0,.713,.38,1.372,.997,1.73l4.25,2.465c.621,.36,1.386,.36,2.007,0l4.25-2.465c.617-.358,.997-1.017,.997-1.73h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.606,7.655c-.044-.136-.161-.235-.302-.255l-2.051-.298-.917-1.858c-.127-.256-.546-.256-.673,0l-.917,1.858-2.051,.298c-.141,.021-.258,.12-.302,.255-.044,.136-.007,.285,.095,.384l1.484,1.446-.351,2.042c-.024,.141,.034,.283,.149,.367s.269,.094,.395,.029l1.834-.964,1.834,.964c.055,.029,.115,.043,.174,.043,.078,0,.155-.024,.221-.072,.115-.084,.173-.226,.149-.367l-.351-2.042,1.484-1.446c.102-.1,.139-.249,.095-.384Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default logo;
