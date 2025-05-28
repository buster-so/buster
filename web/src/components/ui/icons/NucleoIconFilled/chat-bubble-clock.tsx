import React from 'react';

import type { iconProps } from './iconProps';

function chatBubbleClock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.5,13c0-3.033,2.468-5.5,5.5-5.5,.901,0,1.749,.222,2.5,.607v-3.357c0-1.517-1.233-2.75-2.75-2.75H4.25c-1.517,0-2.75,1.233-2.75,2.75v11.5c0,.288,.165,.551,.425,.676,.104,.05,.215,.074,.325,.074,.167,0,.333-.056,.469-.165l3.544-2.835h2.333c-.06-.325-.096-.658-.096-1Z"
          fill="currentColor"
        />
        <path
          d="M14,9c-2.206,0-4,1.794-4,4s1.794,4,4,4,4-1.794,4-4-1.794-4-4-4Zm2.312,4.95c-.119,.29-.398,.465-.693,.465-.096,0-.191-.018-.285-.056l-1.619-.665c-.281-.116-.465-.39-.465-.694v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.247l1.154,.474c.383,.157,.566,.596,.408,.979Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chatBubbleClock;
