import React from 'react';

import type { iconProps } from './iconProps';

function faceGrinWink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face grin wink';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-4,7c0-.552,.448-1,1-1s1,.448,1,1-.448,1-1,1-1-.448-1-1Zm4,6c-1.531,0-2.859-1.14-3.089-2.651-.034-.221,.039-.444,.193-.598,.151-.15,.358-.217,.572-.185,1.526,.24,3.106,.24,4.638,.001h0c.217-.032,.428,.036,.583,.189,.153,.153,.225,.373,.192,.589-.229,1.513-1.557,2.654-3.089,2.654Zm4.097-5.296c-.147,.194-.371,.296-.598,.296-.158,0-.317-.05-.453-.153-.129-.098-.402-.263-.776-.269-.421,.021-.681,.167-.818,.27-.331,.25-.801,.185-1.05-.146-.25-.33-.185-.801,.146-1.05,.29-.219,.904-.588,1.745-.574,.803,.012,1.386,.365,1.661,.575,.33,.25,.394,.721,.144,1.051Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceGrinWink;
