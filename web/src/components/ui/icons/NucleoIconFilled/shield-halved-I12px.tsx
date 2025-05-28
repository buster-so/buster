import React from 'react';

import type { iconProps } from './iconProps';

function shieldHalved(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shield halved';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.783,2.813l-5.25-1.68c-.348-.111-.717-.111-1.066,0L3.216,2.813c-.727,.233-1.216,.903-1.216,1.667v6.52c0,3.507,4.945,5.379,6.461,5.869,.177,.057,.357,.086,.539,.086s.362-.029,.538-.086c1.517-.49,6.462-2.362,6.462-5.869V4.48c0-.764-.489-1.434-1.217-1.667Zm-.283,8.187c0,2.559-4.518,4.149-5.424,4.442-.026,.008-.051,0-.076,0V2.55c.025,0,.051,.004,.076,.012l5.249,1.68c.104,.033,.175,.129,.175,.238v6.52Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shieldHalved;
