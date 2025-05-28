import React from 'react';

import type { iconProps } from './iconProps';

function shieldSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shield slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.692,14.308L15.051,2.949c-.089-.047-.17-.104-.268-.136l-5.25-1.68c-.348-.111-.717-.111-1.066,0L3.216,2.813c-.727,.233-1.216,.903-1.216,1.667v6.52c0,1.336,.719,2.433,1.692,3.308Z"
          fill="currentColor"
        />
        <path
          d="M5.565,15.616c1.156,.644,2.295,1.058,2.895,1.252,.177,.057,.357,.086,.539,.086s.362-.029,.538-.086c1.517-.49,6.462-2.362,6.462-5.869V5.182L5.565,15.616Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shieldSlash;
