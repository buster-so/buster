import React from 'react';

import type { iconProps } from './iconProps';

function clone2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clone 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="12.5" width="12.5" fill="currentColor" rx="2.75" ry="2.75" x="4.5" y="4.5" />
        <path
          d="M3,13.354c-.094,0-.189-.018-.281-.055-1.044-.423-1.718-1.424-1.718-2.55V3.75c0-1.516,1.234-2.75,2.75-2.75h7c1.126,0,2.127,.674,2.55,1.718,.155,.384-.03,.821-.414,.977s-.821-.03-.977-.414c-.192-.475-.647-.782-1.159-.782H3.75c-.689,0-1.25,.561-1.25,1.25v7c0,.512,.307,.967,.782,1.159,.384,.156,.569,.593,.414,.977-.118,.292-.399,.468-.696,.468Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clone2;
