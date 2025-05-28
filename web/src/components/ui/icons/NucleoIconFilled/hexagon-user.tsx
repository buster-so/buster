import React from 'react';

import type { iconProps } from './iconProps';

function hexagonUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hexagon user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="7.75" fill="currentColor" r="2.75" />
        <path
          d="M4.893,13.868l3.103,1.8c.621,.36,1.386,.36,2.007,0l3.106-1.802h0c-.849-1.46-2.423-2.366-4.109-2.366-1.673,0-3.235,.895-4.107,2.368Z"
          fill="currentColor"
        />
        <path
          d="M9,16.687c-.477,0-.954-.124-1.38-.37l-4.25-2.465c-.845-.491-1.37-1.402-1.37-2.379V6.527c0-.977,.525-1.888,1.37-2.378L7.62,1.683c.852-.493,1.908-.493,2.76,0l4.25,2.465c.845,.491,1.37,1.402,1.37,2.379v4.946c0,.977-.525,1.888-1.37,2.378l-4.25,2.465c-.426,.247-.903,.37-1.38,.37Zm0-13.875c-.217,0-.434,.056-.627,.168l-4.25,2.465c-.384,.223-.623,.637-.623,1.081v4.946c0,.444,.239,.858,.623,1.082l4.25,2.464c.387,.225,.867,.225,1.254,0l4.25-2.465c.384-.223,.623-.637,.623-1.081V6.527c0-.444-.239-.858-.623-1.082l-4.25-2.464c-.193-.112-.41-.168-.627-.168Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hexagonUser;
