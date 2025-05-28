import React from 'react';

import type { iconProps } from './iconProps';

function broomSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px broom sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25 1.5L10.376 7.374"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.376,7.374c3.158,2.77-.077,6.653-2.123,8.288-.51,.408-1.186,.554-1.814,.375-2.745-.781-4.391-3.076-4.689-6.037,1.375-.188,2.192-.997,3.447-2.268,1.56-1.581,3.803-1.566,5.179-.358Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.096,7.032c.488,.791,1.111,1.636,1.904,2.468,1.074,1.125,2.194,1.948,3.204,2.546"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.658,11.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"
          fill="currentColor"
        />
        <path
          d="M5.493,3.492l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356Z"
          fill="currentColor"
        />
        <circle cx="8.25" cy="2.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default broomSparkle;
