import React from 'react';

import type { iconProps } from './iconProps';

function userPen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M8.869,15.906l.63-1.559c.169-.416,.41-.779,.72-1.085l2.898-2.898c-1.175-.859-2.602-1.363-4.116-1.363-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.534,.484,3.123,.733,4.725,.759-.039-.362-.011-.732,.132-1.084Z"
          fill="currentColor"
        />
        <path
          d="M17.061,10.642c-.564-.562-1.536-.564-2.098-.004l-3.689,3.691c-.164,.162-.293,.356-.383,.578,0,0,0,.001,0,.002l-.63,1.561c-.112,.277-.049,.595,.162,.808,.144,.145,.337,.223,.533,.223,.092,0,.184-.017,.272-.051l1.514-.59c.226-.088,.427-.219,.603-.393l3.723-3.724c.281-.281,.436-.655,.434-1.051-.002-.394-.157-.765-.439-1.048Zm-5.475,4.547h0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userPen;
