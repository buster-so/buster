import React from 'react';

import type { iconProps } from './iconProps';

function constructionCrane(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px construction crane';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,10h-.75v-3.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.75h-.75c-.689,0-1.25,.561-1.25,1.25v1.5c0,.689,.561,1.25,1.25,1.25h3c.689,0,1.25-.561,1.25-1.25v-1.5c0-.689-.561-1.25-1.25-1.25Z"
          fill="currentColor"
        />
        <path
          d="M16.672,5.286l-.6-1.501c-.191-.477-.647-.785-1.161-.785h-5.911v-.75c0-.689-.561-1.25-1.25-1.25h-2.5c-.689,0-1.25,.561-1.25,1.25v.75h-1.75c-.689,0-1.25,.561-1.25,1.25v1.5c0,.689,.561,1.25,1.25,1.25h1.75V15.5h-1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1V7h6.512c.416,0,.803-.206,1.035-.55,.233-.344,.279-.78,.125-1.164ZM5.5,10h2v1.5h-2v-1.5Zm0-7.5h2v3h-2V2.5Zm2,4.5v1.5h-2v-1.5h2Zm-2,8.5v-2.5h2v2.5h-2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default constructionCrane;
