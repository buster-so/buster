import React from 'react';

import type { iconProps } from './iconProps';

function ballCrystal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ball crystal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.06,13.25l.919,2.316c.13,.328-.112,.684-.465,.684H4.486c-.353,0-.595-.356-.465-.684l.918-2.316"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.744,8.491l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356h0Z"
          fill="currentColor"
        />
        <path
          d="M9,4.75c-2.067,0-3.75,1.682-3.75,3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.659,2.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474h-.001Z"
          fill="currentColor"
        />
        <path
          d="M10.497,2.438c-.481-.118-.98-.188-1.497-.188-3.452,0-6.25,2.798-6.25,6.25,0,1.901,.849,3.604,2.188,4.75H13.061c1.34-1.146,2.189-2.849,2.189-4.75,0-.304-.029-.6-.071-.892"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="2.75" cy="1.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default ballCrystal;
