import React from 'react';

import type { iconProps } from './iconProps';

function gauge6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gauge 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.75" fill="currentColor" r=".75" />
        <circle cx="13.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="4.75" cy="9" fill="currentColor" r=".75" />
        <path
          d="M12.536,5.464c-.293-.293-.768-.293-1.061,0-.293,.293-.293,.768,0,1.061,.293,.293,.768,.293,1.061,0,.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M5.464,5.464c-.293,.293-.293,.768,0,1.061,.293,.293,.768,.293,1.061,0,.293-.293,.293-.768,0-1.061-.293-.293-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M9,1C4.589,1,1,4.589,1,9c0,2.703,1.354,5.204,3.62,6.69,.348,.228,.812,.13,1.038-.216,.228-.346,.131-.811-.216-1.038-1.843-1.208-2.942-3.241-2.942-5.437,0-3.584,2.916-6.5,6.5-6.5s6.5,2.916,6.5,6.5c0,2.196-1.1,4.228-2.942,5.437-.347,.227-.443,.692-.216,1.038,.144,.22,.384,.339,.628,.339,.141,0,.283-.04,.41-.123,2.267-1.486,3.62-3.987,3.62-6.69,0-4.411-3.589-8-8-8Z"
          fill="currentColor"
        />
        <path
          d="M9,7c-.346,0-.647,.237-.729,.573-.254,1.045-1.521,6.303-1.521,7.177,0,1.241,1.01,2.25,2.25,2.25s2.25-1.009,2.25-2.25c0-.874-1.268-6.132-1.521-7.177-.081-.336-.383-.573-.729-.573Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default gauge6;
