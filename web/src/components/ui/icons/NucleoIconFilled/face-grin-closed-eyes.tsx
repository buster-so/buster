import React from 'react';

import type { iconProps } from './iconProps';

function faceGrinClosedEyes(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face grin closed eyes';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-3.5,7.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-1.103,.897-2,2-2s2,.897,2,2c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-.276-.225-.5-.5-.5s-.5,.224-.5,.5Zm3.5,5.75c-1.531,0-2.859-1.14-3.089-2.651-.034-.221,.039-.444,.193-.598,.151-.15,.358-.217,.572-.185,1.526,.24,3.106,.24,4.638,.001h0c.217-.032,.428,.036,.583,.189,.153,.153,.225,.373,.192,.589-.229,1.513-1.557,2.654-3.089,2.654Zm4.25-5c-.414,0-.75-.336-.75-.75,0-.276-.225-.5-.5-.5s-.5,.224-.5,.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-1.103,.897-2,2-2s2,.897,2,2c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceGrinClosedEyes;
