import React from 'react';

import type { iconProps } from './iconProps';

function flipUpHelmet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flip up helmet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.92,8h-7.708c-.114,0-.178,.068-.206,.109-.027,.041-.068,.125-.026,.231l.972,2.5c.037,.095,.131,.159,.232,.159h6.816v-2c0-.34-.033-.672-.08-1Z"
          fill="currentColor"
        />
        <path
          d="M9.184,12.5c-.716,0-1.371-.448-1.631-1.116l-.972-2.5c-.209-.538-.14-1.145,.187-1.622,.326-.477,.866-.762,1.444-.762h7.319c-1.01-2.627-3.553-4.5-6.53-4.5-3.859,0-7,3.14-7,7v1.25c0,3.17,2.579,5.75,5.75,5.75h4.5c1.982,0,3.593-1.551,3.725-3.5h-6.791Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default flipUpHelmet;
