import React from 'react';

import type { iconProps } from './iconProps';

function flipHorizontal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flip horizontal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="9" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="9" cy="15.25" fill="currentColor" r=".75" />
        <path
          d="M3.084,4.937c-.372-.333-.887-.413-1.344-.21-.456,.204-.74,.641-.74,1.141v6.264c0,.5,.284,.938,.74,1.141,.167,.075,.342,.111,.515,.111,.3,0,.593-.11,.828-.321l3.502-3.132c.264-.237,.415-.576,.415-.931s-.151-.694-.416-.932l-3.5-3.131Zm-.584,6.635V6.428l2.876,2.572-2.876,2.572Z"
          fill="currentColor"
        />
        <path
          d="M16.26,4.727c-.457-.205-.971-.124-1.344,.21l-3.501,3.132c-.264,.237-.415,.576-.415,.931s.151,.694,.416,.932l3.5,3.131c.236,.211,.529,.321,.829,.321,.173,0,.348-.037,.515-.111,.456-.204,.74-.641,.74-1.141V5.868c0-.5-.284-.938-.74-1.141Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default flipHorizontal;
