import React from 'react';

import type { iconProps } from './iconProps';

function lassoSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lasso sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,13.75c-2.059,0-2.212-1.591-1.961-2.197,.314-.759,1.204-1.448,3.18-1.272,2.826,.252,4.464,4.406-.469,6.469"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.744,5.492l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356h0Z"
          fill="currentColor"
        />
        <path
          d="M2.294,7.358c-.028,.211-.044,.424-.044,.642,0,3.176,3.022,5.75,6.75,5.75s6.75-2.574,6.75-5.75-3.022-5.75-6.75-5.75c-.523,0-1.03,.056-1.519,.152"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.657,2.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474h0Z"
          fill="currentColor"
        />
        <circle cx="5.25" cy="8.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default lassoSparkle;
