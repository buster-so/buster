import React from 'react';

import type { iconProps } from './iconProps';

function cartHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cart heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="14.25" cy="15.75" fill="currentColor" r="1.25" />
        <circle cx="3.75" cy="15.75" fill="currentColor" r="1.25" />
        <path
          d="M15.25,12.501h0s-10.75,0-10.75,0c-.276,0-.5-.224-.5-.5s.224-.5,.5-.5H13.029c.754,0,1.421-.48,1.66-1.196l.657-1.97c-.144,.084-.276,.157-.38,.212-.3,.157-.634,.239-.967,.239s-.667-.083-.964-.238c-.882-.463-3.401-1.986-4.249-4.547H4.765l-.176-1.196c-.103-.704-.616-1.271-1.307-1.444l-1.351-.337c-.403-.1-.809,.144-.909,.546-.101,.402,.144,.809,.546,.909l1.35,.337c.099,.025,.172,.105,.187,.207l1.032,7.015c-.93,.172-1.637,.985-1.637,1.963,0,1.103,.897,2,2,2H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M13.73,7.219c.17,.089,.368,.089,.538,0,.897-.472,3.731-2.181,3.731-4.961,.004-1.221-.974-2.215-2.187-2.222-.73,.009-1.408,.38-1.813,.991-.405-.611-1.084-.981-1.813-.991-1.213,.007-2.191,1.002-2.187,2.222,0,2.78,2.834,4.489,3.731,4.961Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cartHeart;
