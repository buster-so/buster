import React from 'react';

import type { iconProps } from './iconProps';

function escalatorUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px escalator up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m16.537,12.058c-.092-.038-.189-.058-.287-.058h-3.51c-.414,0-.75.336-.75.75s.336.75.75.75h1.7l-2.22,2.22c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2.22-2.22v1.7c0,.414.336.75.75.75s.75-.336.75-.75v-3.51c0-.098-.02-.195-.058-.287-.076-.183-.222-.329-.405-.406Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.5,5c-1.1027,0-2-.8973-2-2s.8973-2,2-2,2,.8973,2,2-.8973,2-2,2Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.3633,10.5l3.9614-3.697c-.4568-.491-1.1028-.803-1.8246-.803-1.3784,0-2.5,1.1216-2.5,2.5v2h.3633Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m17.501,7.5h0c0-1.3807-1.1193-2.5-2.5-2.5h-1.4624c-.6962,0-1.3664.2642-1.8753.7391l-6.7087,6.2609h-1.9546c-1.3807,0-2.5,1.1193-2.5,2.5h0c0,1.3807,1.1193,2.5,2.5,2.5h1.4621c.6967,0,1.3674-.2644,1.8768-.7397l6.7075-6.2603h1.9546c1.3807,0,2.5-1.1193,2.5-2.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default escalatorUp;
