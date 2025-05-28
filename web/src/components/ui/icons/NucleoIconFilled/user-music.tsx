import React from 'react';

import type { iconProps } from './iconProps';

function userMusic(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user music';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M9,15.75c0-1.811,1.291-3.326,3-3.675v-1.325c0-.336,.095-.648,.23-.939-.981-.513-2.08-.811-3.23-.811-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.076,0,.152-.008,.228-.009-.138-.39-.228-.804-.228-1.241Z"
          fill="currentColor"
        />
        <path
          d="M17.06,11.817c-.397-.18-.78-.396-1.138-.64-.407-.278-.79-.598-1.137-.952-.214-.218-.538-.285-.819-.169s-.466,.39-.466,.694v2.888c-.236-.084-.486-.138-.75-.138-1.241,0-2.25,1.009-2.25,2.25s1.009,2.25,2.25,2.25,2.25-1.009,2.25-2.25v-3.387c.025,.018,.051,.035,.077,.053,.429,.293,.887,.551,1.363,.767,.377,.17,.821,.003,.993-.373,.171-.377,.004-.822-.373-.993Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userMusic;
