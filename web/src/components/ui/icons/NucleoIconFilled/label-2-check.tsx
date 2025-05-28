import React from 'react';

import type { iconProps } from './iconProps';

function label2Check(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label 2 check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.833,8.528l-3.95-4.88c-.334-.412-.83-.648-1.36-.648H4.75c-1.517,0-2.75,1.233-2.75,2.75v4.791c.377,.044,.741,.157,1.049,.377l1.905-2.523c.425-.561,1.096-.894,1.797-.894,.492,0,.959,.156,1.353,.452,.991,.749,1.189,2.162,.442,3.152l-2.94,3.895h6.917c.53,0,1.026-.236,1.36-.649l3.95-4.879c.223-.275,.223-.668,0-.943Z"
          fill="currentColor"
        />
        <path
          d="M3.353,15c-.189,0-.372-.071-.511-.202l-1.609-1.5c-.303-.282-.32-.757-.037-1.06,.283-.303,.757-.319,1.06-.037l1,.932,2.896-3.836c.25-.33,.72-.396,1.051-.146,.331,.25,.396,.72,.146,1.051l-3.397,4.5c-.128,.169-.322,.276-.534,.295-.021,.002-.043,.003-.065,.003Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default label2Check;
