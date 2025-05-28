import React from 'react';

import type { iconProps } from './iconProps';

function bullhorn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bullhorn';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.029,13h-3.569l.714,3.413c.082,.393,.312,.73,.648,.949,.247,.161,.529,.244,.816,.244,.104,0,.209-.011,.313-.033l.489-.104c.809-.171,1.328-.968,1.157-1.778l-.569-2.692Z"
          fill="currentColor"
        />
        <path
          d="M16.185,5.912c-.117,.095-.185,.237-.185,.388v2.399c0,.151,.068,.293,.185,.388,.117,.095,.271,.132,.418,.101,.822-.173,1.397-.868,1.397-1.689s-.575-1.516-1.397-1.689c-.147-.031-.301,.006-.418,.101Z"
          fill="currentColor"
        />
        <path d="M5,3.5C2.794,3.5,1,5.294,1,7.5s1.794,4,4,4V3.5Z" fill="currentColor" />
        <path
          d="M14.493,1.041c-.303-.104-.638-.004-.835,.25-.476,.615-2.062,2.209-3.657,2.209h-3.5V11.5h3.5c1.911,0,3.641,2.188,3.658,2.21,.145,.186,.365,.289,.592,.289,.082,0,.164-.013,.244-.041,.303-.104,.506-.388,.506-.708V1.75c0-.321-.204-.606-.507-.709Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bullhorn;
