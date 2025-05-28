import React from 'react';

import type { iconProps } from './iconProps';

function pencil(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pencil';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.953,7.578l1.109-1.109c.586-.586,.586-1.536,0-2.121l-1.409-1.409c-.586-.586-1.536-.586-2.121,0l-1.109,1.109,3.53,3.53Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.922,5.547l-4.775,4.775c-.25,.25-.429,.562-.52,.904l-1.127,4.273h0s4.273-1.127,4.273-1.127c.342-.09,.654-.27,.904-.52l4.775-4.775"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.672 7.297L6.265 11.704"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default pencil;
