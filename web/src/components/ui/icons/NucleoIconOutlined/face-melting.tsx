import React from 'react';

import type { iconProps } from './iconProps';

function faceMelting(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face melting';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.312,13.438c-.259-.201-.492-.312-.656-.375-.756-.292-1.153-.017-2.007-.33-.314-.115-.527-.251-.648-.336,0,0-.296-.209-.526-.491-.557-.681-.589-1.655-.593-1.822"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.148,10.194c.363-2.223-.307-4.606-2.022-6.321C11.295,1.042,6.705,1.042,3.873,3.874c-1.668,1.668-2.32,3.963-2.053,6.098,.081,.603,.08,1.408-.351,2.137-.258,.436-.519,.59-.469,.828,.146,.695,2.609,.51,2.687,1.062,.068,.48-1.48,.808-1.437,1.25,.062,.641,3.447,1.37,6.432,.779,.54-.107,1.786-.399,3.525-.5,.506-.029,.863-.062,1.355-.029,1.915,.127,2.917,1.208,3.344,.5,.385-.638-2.231-1.919-1.906-2.75,.226-.579,1.938-.407,2-.875,.033-.246-.439-.363-.719-.906-.233-.451-.199-.935-.133-1.275Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7" cy="7" fill="currentColor" r="1" />
        <circle cx="11" cy="10" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default faceMelting;
