import React from 'react';

import type { iconProps } from './iconProps';

function imageSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.444,9.056c-1.038-1.039-2.851-1.039-3.889,0L3.678,14.934c.31,.198,.677,.316,1.072,.316H13.25c1.105,0,2-.896,2-2v-2.389l-1.806-1.806Z"
          fill="currentColor"
        />
        <path
          d="M9.158,6.508l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"
          fill="currentColor"
        />
        <path
          d="M13.25,16H4.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75H13.25c1.517,0,2.75,1.233,2.75,2.75V13.25c0,1.517-1.233,2.75-2.75,2.75ZM4.75,3.5c-.689,0-1.25,.561-1.25,1.25V13.25c0,.689,.561,1.25,1.25,1.25H13.25c.689,0,1.25-.561,1.25-1.25V4.75c0-.689-.561-1.25-1.25-1.25H4.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default imageSparkle;
