import React from 'react';

import type { iconProps } from './iconProps';

function clonePlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clone plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,17H7.25c-1.126,0-2.127-.674-2.55-1.718-.155-.384,.03-.821,.414-.977,.385-.155,.822,.03,.977,.414,.192,.475,.647,.782,1.159,.782h7c.689,0,1.25-.561,1.25-1.25V7.25c0-.512-.307-.967-.782-1.159-.384-.156-.569-.593-.414-.977,.156-.384,.594-.567,.977-.414,1.044,.423,1.718,1.424,1.718,2.55v7c0,1.516-1.234,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M10.75,1H3.75c-1.517,0-2.75,1.233-2.75,2.75v7c0,1.517,1.233,2.75,2.75,2.75h7c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75Zm-1,7h-1.75v1.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75h-1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.75v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.75h1.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clonePlus;
