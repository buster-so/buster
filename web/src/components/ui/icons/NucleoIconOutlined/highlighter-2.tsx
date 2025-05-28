import React from 'react';

import type { iconProps } from './iconProps';

function highlighter2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px highlighter 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.352,2.991c.179,.643,.344,1.537,.287,2.6-.03,.556-.115,1.052-.218,1.476-.075,.305,.076,.619,.365,.742l1.388,.593,1.388,.593c.289,.123,.62,.016,.789-.249,.234-.368,.534-.772,.915-1.178,.725-.772,1.481-1.271,2.068-1.586"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8,1.247l-.641,1.109c-.193,.33-.052,.755,.3,.905l3.138,1.34,3.138,1.34c.352,.15,.755-.042,.861-.409l.37-1.296"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25,10.75h-1c-.828,0-1.5,.672-1.5,1.5h0c0,.828,.672,1.5,1.5,1.5H14.75c.828,0,1.5,.672,1.5,1.5h0c0,.828-.672,1.5-1.5,1.5h-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.252 8.861L9.494 10.75 6.788 10.75 8.027 7.911 10.252 8.861z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default highlighter2;
