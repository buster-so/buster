import React from 'react';

import type { iconProps } from './iconProps';

function messagePen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px message pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.999,13.347c.169-.416,.41-.779,.72-1.085l3.684-3.685c.554-.554,1.301-.858,2.104-.858,.166,0,.331,.021,.493,.048v-3.517c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v7c0,1.517,1.233,2.75,2.75,2.75h1.25v2.25c0,.288,.165,.551,.425,.676,.104,.05,.215,.074,.325,.074,.167,0,.333-.056,.469-.165l3.503-2.803,.277-.685Z"
          fill="currentColor"
        />
        <path
          d="M15.463,9.638l-3.689,3.691c-.164,.162-.293,.356-.383,.578,0,0,0,.001,0,.002l-.63,1.561c-.112,.277-.049,.595,.162,.808,.144,.145,.337,.223,.533,.223,.092,0,.184-.017,.272-.051l1.514-.59c.226-.088,.427-.219,.603-.393l3.723-3.724c.281-.281,.436-.655,.434-1.051-.002-.394-.157-.765-.439-1.048-.564-.562-1.537-.565-2.098-.004Zm-3.378,4.552h0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default messagePen;
