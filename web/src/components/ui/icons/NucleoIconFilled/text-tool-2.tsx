import React from 'react';

import type { iconProps } from './iconProps';

function textTool2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text tool 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,15.5H3.75c-1.517,0-2.75-1.233-2.75-2.75v-.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v.75c0,.689,.561,1.25,1.25,1.25H14.25c.689,0,1.25-.561,1.25-1.25v-.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v.75c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,6.75c-.414,0-.75-.336-.75-.75v-.75c0-.689-.561-1.25-1.25-1.25H3.75c-.689,0-1.25,.561-1.25,1.25v.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-.75c0-1.517,1.233-2.75,2.75-2.75H14.25c1.517,0,2.75,1.233,2.75,2.75v.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.489,11.959l-2.73-6.5c-.117-.278-.39-.459-.691-.459h-.135c-.302,0-.574,.181-.691,.459l-2.73,6.5c-.16,.382,.02,.822,.401,.982,.379,.16,.821-.018,.981-.401l.437-1.041h3.339l.437,1.041c.12,.287,.398,.459,.691,.459,.097,0,.195-.019,.29-.059,.382-.16,.562-.6,.401-.982Zm-4.528-1.959l1.039-2.474,1.039,2.474h-2.078Z"
          fill="currentColor"
        />
        <circle cx="1.75" cy="9" fill="currentColor" r=".75" />
        <circle cx="16.25" cy="9" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default textTool2;
