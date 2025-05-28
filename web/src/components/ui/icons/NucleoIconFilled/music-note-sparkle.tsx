import React from 'react';

import type { iconProps } from './iconProps';

function musicNoteSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px music note sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.487,5.861c.862-.118,1.513-.864,1.513-1.734v-1.231c0-.505-.218-.986-.599-1.318-.381-.333-.893-.484-1.387-.416l-3.5,.477h0c-.862,.118-1.513,.864-1.513,1.734v7.262c-.568-.398-1.256-.635-2-.635-1.93,0-3.5,1.57-3.5,3.5s1.57,3.5,3.5,3.5,3.5-1.57,3.5-3.5V6.405l3.987-.543Z"
          fill="currentColor"
        />
        <path
          d="M2.875,7.973c.161,0,.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256Z"
          fill="currentColor"
        />
        <path
          d="M16.658,10.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"
          fill="currentColor"
        />
        <circle cx="5.25" cy="2.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default musicNoteSparkle;
