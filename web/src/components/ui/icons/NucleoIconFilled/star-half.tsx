import React from 'react';

import type { iconProps } from './iconProps';

function starHalf(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px star half';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.963,6.786c-.088-.271-.322-.469-.605-.51l-4.619-.671L9.673,1.418c-.254-.512-1.092-.512-1.346,0l-2.065,4.186-4.619,.671c-.283,.041-.518,.239-.605,.51-.089,.271-.015,.57,.189,.769l3.343,3.258-.789,4.601c-.048,.282,.067,.566,.299,.734,.229,.167,.536,.189,.789,.057l4.132-2.173,4.132,2.173c.109,.058,.229,.086,.349,.086,.155,0,.311-.048,.44-.143,.231-.168,.347-.452,.299-.734l-.789-4.601,3.343-3.258c.204-.199,.278-.498,.189-.769Zm-4.861,3.228c-.177,.172-.258,.42-.216,.664l.599,3.492-3.136-1.649c-.108-.057-.229-.086-.349-.086V3.445l1.567,3.177c.109,.221,.32,.375,.565,.41l3.506,.509-2.537,2.473Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default starHalf;
