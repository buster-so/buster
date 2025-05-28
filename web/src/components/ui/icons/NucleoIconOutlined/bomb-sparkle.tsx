import React from 'react';

import type { iconProps } from './iconProps';

function bombSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bomb sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.34,4.158l.72-.72c.486-.486,1.274-.486,1.76,0l.88,.88c.417,.417,1.057,.476,1.537,.177"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.993,7.769l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356Z"
          fill="currentColor"
        />
        <path
          d="M12.74,9.323c-.026-.835-.227-1.624-.572-2.333,.534-.533,.799-.799,1.333-1.333-.256-.435-.643-.993-1.212-1.551-.519-.509-1.033-.864-1.445-1.106l-1.333,1.333c-.759-.37-1.609-.583-2.51-.583C3.824,3.75,1.25,6.324,1.25,9.5s2.574,5.75,5.75,5.75c.628,0,1.23-.104,1.796-.29"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.658,13.026l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"
          fill="currentColor"
        />
        <circle cx="5.25" cy="11.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default bombSparkle;
