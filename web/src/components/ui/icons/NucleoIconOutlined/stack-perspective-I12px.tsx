import React from 'react';

import type { iconProps } from './iconProps';

function stackPerspective(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px stack perspective';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m9.135,9.074l-3,1.929c-.166.107-.385-.013-.385-.21V1.208c0-.198.219-.317.385-.21l3,1.929c.072.046.115.125.115.21v5.727c0,.085-.043.164-.115.21Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.25,3.214l-1.225-.787c-.119-.076-.275.009-.275.15v6.846c0,.141.156.227.275.15l1.225-.787"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default stackPerspective;
