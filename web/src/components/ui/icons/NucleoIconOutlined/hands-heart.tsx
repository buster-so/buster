import React from 'react';

import type { iconProps } from './iconProps';

function handsHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hands heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.781,6.447c.138,.071,.299,.071,.437,0,.729-.374,3.031-1.73,3.031-3.934,.004-.968-.791-1.757-1.777-1.763-.593,.007-1.144,.301-1.473,.786-.329-.484-.881-.778-1.473-.786-.985,.006-1.78,.794-1.777,1.763,0,2.205,2.303,3.56,3.031,3.934Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,8.391v-2.891c0-.69,.56-1.25,1.25-1.25h0c.69,0,1.25,.56,1.25,1.25v5.54c0,.459-.158,.905-.448,1.261l-2.802,3.449v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.809,11.991l1.507-1.896c.443-.545,.339-1.35-.228-1.765h0c-.528-.386-1.266-.291-1.678,.217l-1.719,2.153c-.285,.355-.44,.796-.44,1.251v4.799"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,8.391v-2.891c0-.69-.56-1.25-1.25-1.25h0c-.69,0-1.25,.56-1.25,1.25v5.54c0,.459,.158,.905,.448,1.261l2.802,3.449v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.191,11.991l-1.507-1.896c-.443-.545-.339-1.35,.228-1.765h0c.528-.386,1.266-.291,1.678,.217l1.719,2.153c.285,.355,.44,.796,.44,1.251v4.799"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default handsHeart;
