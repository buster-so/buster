import React from 'react';

import type { iconProps } from './iconProps';

function fireworks(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px fireworks';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="2" cy="6" fill="currentColor" r="1" />
        <circle cx="16" cy="6" fill="currentColor" r="1" />
        <path
          d="M13.25,6.75s-4.25,1.727-4.25,9.5c0-7.773-4.25-9.5-4.25-9.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.158,2.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"
          fill="currentColor"
        />
        <path
          d="M5.658,12.026l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"
          fill="currentColor"
        />
        <path
          d="M12.342,12.026l1.263-.421,.421-1.263c.137-.408,.813-.408,.949,0l.421,1.263,1.263,.421c.204,.068,.342,.259,.342,.474s-.138,.406-.342,.474l-1.263,.421-.421,1.263c-.068,.204-.26,.342-.475,.342s-.406-.138-.475-.342l-.421-1.263-1.263-.421c-.204-.068-.342-.259-.342-.474s.138-.406,.342-.474Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default fireworks;
