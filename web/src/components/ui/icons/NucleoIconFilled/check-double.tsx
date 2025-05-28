import React from 'react';

import type { iconProps } from './iconProps';

function checkDouble(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px check double';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.5,15c-.229,0-.446-.105-.589-.285L.161,9.965c-.256-.325-.201-.797,.124-1.054,.326-.256,.796-.202,1.054,.124l3.158,4L11.909,3.539c.255-.327,.725-.386,1.053-.13,.327,.255,.385,.726,.13,1.053L5.091,14.711c-.142,.182-.39,.259-.591,.289Z"
          fill="currentColor"
        />
        <path
          d="M9.25,15c-.229,0-.446-.105-.588-.285l-.744-.942c-.257-.325-.202-.797,.124-1.053,.326-.257,.796-.202,1.053,.124l.152,.193L16.659,3.539c.254-.327,.726-.386,1.053-.13,.327,.255,.385,.726,.13,1.053L9.841,14.711c-.142,.182-.359,.288-.589,.289h-.002Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default checkDouble;
