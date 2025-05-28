import React from 'react';

import type { iconProps } from './iconProps';

function gavel(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gavel';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,16.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.353,12.505l-3.425-3.423-2.351,2.352,3.423,3.425c.314,.314,.732,.487,1.177,.487s.862-.173,1.177-.487c.648-.648,.648-1.704,0-2.354Z"
          fill="currentColor"
        />
        <path
          d="M13.522,5.306l-3.578-3.578s0,0,0,0h0l-.5-.5c-.293-.293-.768-.293-1.061,0-.282,.282-.286,.729-.024,1.024L2.752,7.86c-.295-.261-.742-.258-1.024,.024-.293,.293-.293,.768,0,1.061l3.578,3.578s0,0,0,0h0l.5,.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.282-.282,.286-.729,.024-1.024l5.608-5.608c.142,.126,.316,.196,.494,.196,.192,0,.384-.073,.53-.22,.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default gavel;
