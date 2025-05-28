import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldRightSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold right sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.494,2.491l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356h0Z"
          fill="currentColor"
        />
        <path
          d="M5.002,11.25h3.748v2.743c0,.413,.473,.648,.802,.398l6.581-4.993c.264-.2,.264-.597,0-.797L9.552,3.609c-.329-.25-.802-.015-.802,.398v2.743H2.75c-.552,0-1,.448-1,1v1.625"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.659,12.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474h-.001Z"
          fill="currentColor"
        />
        <circle cx="1.25" cy="4.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default arrowBoldRightSparkle;
