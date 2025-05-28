import React from 'react';

import type { iconProps } from './iconProps';

function userCloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M8.5,15.875c0-1.747,1.244-3.208,2.893-3.549,.556-.75,1.333-1.302,2.21-1.593-1.251-1.095-2.878-1.732-4.603-1.732-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.52,.479,3.093,.728,4.68,.757-.115-.353-.193-.722-.193-1.113Z"
          fill="currentColor"
        />
        <path
          d="M15,12c-1.186,0-2.241,.714-2.72,1.756-1.202-.088-2.28,.895-2.28,2.119,0,1.172,.953,2.125,2.125,2.125h2.875c1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userCloud;
