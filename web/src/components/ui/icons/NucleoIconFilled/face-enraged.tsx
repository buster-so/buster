import React from 'react';

import type { iconProps } from './iconProps';

function faceEnraged(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face enraged';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1ZM4.543,7.586c.067-.318,.45-.456,.731-.294l2.452,1.416c.281,.162,.353,.563,.111,.78-.627,.563-1.568,.688-2.337,.244-.769-.444-1.132-1.322-.957-2.146Zm7.109,6.048c-.125,.079-.264,.116-.401,.116-.248,0-.491-.123-.634-.349-.354-.559-.958-.893-1.616-.893s-1.262,.334-1.616,.893c-.223,.349-.686,.452-1.035,.232-.35-.222-.454-.685-.232-1.035,.631-.996,1.709-1.59,2.884-1.59s2.253,.595,2.884,1.59c.222,.35,.117,.813-.232,1.035Zm.849-3.902c-.769,.444-1.711,.319-2.337-.244-.241-.217-.17-.618,.111-.78l2.452-1.416c.281-.162,.664-.024,.731,.294,.175,.824-.188,1.702-.957,2.146Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceEnraged;
