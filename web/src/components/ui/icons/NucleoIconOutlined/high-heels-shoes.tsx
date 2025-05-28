import React from 'react';

import type { iconProps } from './iconProps';

function highHeelsShoes(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px high heels shoes';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75 15.25L3.75 9.964"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.749,9.964c-1.195-.692-1.999-1.984-1.999-3.464,0-1.625,.979-3.163,2.25-3.75,2.082,4.017,5.485,7.292,8.84,9.152,.431,.239,.918,.348,1.41,.348h0c1.105,0,2,.895,2,2v.5c0,.276-.224,.5-.5,.5h-3.567c-.684,0-1.328-.341-1.685-.924-.657-1.073-1.852-2.578-3.831-3.534-1.103-.532-2.136-.744-2.917-.828h-.001Z"
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

export default highHeelsShoes;
