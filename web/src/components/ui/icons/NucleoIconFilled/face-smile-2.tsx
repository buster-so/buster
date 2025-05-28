import React from 'react';

import type { iconProps } from './iconProps';

function faceSmile2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face smile 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1ZM5,9c0-.552,.448-1,1-1s1,.448,1,1-.448,1-1,1-1-.448-1-1Zm6.884,3.16c-.631,.996-1.709,1.59-2.884,1.59s-2.253-.595-2.884-1.59c-.222-.35-.117-.813,.232-1.035,.349-.221,.813-.118,1.035,.232,.354,.559,.958,.893,1.616,.893s1.262-.334,1.616-.893c.222-.35,.684-.454,1.035-.232,.35,.222,.454,.685,.232,1.035Zm.116-2.16c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceSmile2;
