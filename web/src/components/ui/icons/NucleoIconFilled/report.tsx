import React from 'react';

import type { iconProps } from './iconProps';

function report(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px report';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.487,5.427l-3.915-3.915c-.3278-.3279-.7724-.512-1.236-.512h-5.586c-1.5188,0-2.75,1.2312-2.75,2.75v10.5c0,1.5188,1.2312,2.75,2.75,2.75h8.5c1.5188,0,2.75-1.2312,2.75-2.75v-7.5845c0-.4646-.1845-.9102-.513-1.2385Zm-8.487,7.823c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-2.75c0-.4141.3359-.75.75-.75s.75.3359.75.75v2.75Zm2.75,0c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-5.25c0-.4141.3359-.75.75-.75s.75.3359.75.75v5.25Zm2.75,0c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-1.5c0-.4141.3359-.75.75-.75s.75.3359.75.75v1.5Zm1.933-6.75h-2.932c-.55,0-1-.45-1-1v-2.9209h-.001c.009-.0042.004-.001.013-.0051l3.922,3.9211s-.001.0029-.002.0049Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default report;
