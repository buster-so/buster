import React from 'react';

import type { iconProps } from './iconProps';

function necktie(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px necktie';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.25,5.25l1.881,8.464c.074,.334-.027,.682-.269,.924l-2.155,2.155c-.391,.391-1.024,.391-1.414,0l-2.155-2.155c-.242-.242-.343-.59-.269-.924l1.881-8.464"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.736,2.65c.294-.515,.085-1.186-.464-1.411-.579-.238-1.351-.451-2.272-.451s-1.693,.213-2.272,.451c-.549,.225-.758,.896-.464,1.411,.495,.867,.99,1.733,1.486,2.6h2.5l1.486-2.6Z"
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

export default necktie;
