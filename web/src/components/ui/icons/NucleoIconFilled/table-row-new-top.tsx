import React from 'react';

import type { iconProps } from './iconProps';

function tableRowNewTop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table row new top';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.232,2.437c-.386-.148-.821,.045-.969,.432-.148,.387,.045,.82,.432,.969,.489,.188,.805,.644,.805,1.163v4H3.5V5c0-.519,.316-.976,.805-1.163,.387-.148,.58-.582,.432-.969s-.583-.581-.969-.432c-1.074,.412-1.768,1.418-1.768,2.563V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V5c0-1.146-.694-2.151-1.768-2.563Z"
          fill="currentColor"
        />
        <path
          d="M6.5,4h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.75V.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableRowNewTop;
