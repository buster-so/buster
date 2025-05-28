import React from 'react';

import type { iconProps } from './iconProps';

function shareLeft2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share left 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.547,10.939c.275-.119,.453-.39,.453-.689v-1.942c2.763,.43,4.61,3.085,4.63,3.114,.143,.208,.376,.327,.62,.327,.074,0,.148-.011,.221-.034,.314-.097,.529-.387,.529-.716,0-2.386-1.277-6.795-6-7.217V1.75c0-.299-.178-.57-.453-.689-.275-.118-.594-.061-.812,.144L1.235,5.455c-.15,.142-.235,.339-.235,.545s.085,.404,.235,.545l4.5,4.25c.218,.206,.537,.263,.812,.144Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.5c.689,0,1.25,.561,1.25,1.25V13.25c0,.689-.561,1.25-1.25,1.25H4.75c-.689,0-1.25-.561-1.25-1.25v-2.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.5c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shareLeft2;
