import React from 'react';

import type { iconProps } from './iconProps';

function necktie2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px necktie 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.743,5h4.514l1.13-1.978c.251-.44,.302-.967,.137-1.446-.16-.469-.513-.845-.967-1.031-1.639-.672-3.475-.672-5.113,0-.454,.187-.807,.562-.967,1.031-.165,.479-.114,1.007,.137,1.446l1.13,1.978Z"
          fill="currentColor"
        />
        <path
          d="M11.296,6.5H6.704l-1.567,7.051c-.13,.587,.045,1.191,.471,1.617l2.155,2.155c.33,.331,.77,.513,1.237,.513s.907-.182,1.237-.513l2.156-2.155c.425-.426,.6-1.03,.47-1.616l-1.567-7.052Z"
          fill="currentColor"
        />
        <path
          d="M14.655,10.394l-2.648-3.894h-1.814l3.222,4.737c.067,.099,.054,.233-.03,.318-.293,.293-.293,.768,0,1.061,.146,.146,.339,.219,.53,.219,.192,0,.384-.073,.53-.22,.593-.593,.681-1.527,.21-2.221Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default necktie2;
