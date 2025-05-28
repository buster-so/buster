import React from 'react';

import type { iconProps } from './iconProps';

function userHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M8.5,12.722c-.006-1.571,.978-2.916,2.36-3.459-.598-.166-1.221-.262-1.86-.262-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769h.002c.437,0,.872-.019,1.306-.053-.974-1.043-1.807-2.451-1.807-4.226Z"
          fill="currentColor"
        />
        <path
          d="M13.731,17.683c.17,.089,.368,.089,.538,0,.897-.472,3.731-2.181,3.731-4.961,.004-1.221-.974-2.215-2.187-2.222-.73,.009-1.408,.38-1.813,.991-.405-.611-1.084-.981-1.813-.991-1.213,.007-2.191,1.002-2.187,2.222,0,2.78,2.834,4.489,3.731,4.961Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userHeart;
