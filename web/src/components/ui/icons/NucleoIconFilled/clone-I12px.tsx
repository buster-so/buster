import React from 'react';

import type { iconProps } from './iconProps';

function clone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="12.5" width="12.5" fill="currentColor" rx="2.75" ry="2.75" x="1" y="1" />
        <path
          d="M15.282,4.7c-.384-.153-.821,.03-.977,.414-.155,.384,.03,.821,.414,.977,.475,.192,.782,.647,.782,1.159v7c0,.689-.561,1.25-1.25,1.25H7.25c-.512,0-.967-.307-1.159-.782-.155-.384-.592-.568-.977-.414-.384,.156-.569,.593-.414,.977,.423,1.044,1.424,1.718,2.55,1.718h7c1.516,0,2.75-1.234,2.75-2.75V7.25c0-1.126-.674-2.127-1.718-2.55Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clone;
