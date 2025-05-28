import React from 'react';

import type { iconProps } from './iconProps';

function personDressArrowUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person dress arrow up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="6.001"
          cy="2.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.076,13.617l-1.659-6.014c-.105-.382-.421-.664-.812-.726-.469-.073-1.008-.125-1.604-.125-.45,0-.99,.029-1.594,.123-.392,.061-.717,.344-.822,.726l-1.659,6.014c-.088,.318,.152,.633,.482,.633h1.593s.174,2.083,.174,2.083c.043,.518,.476,.917,.997,.917h1.66c.52,0,.953-.399,.997-.917l.174-2.083h1.593c.33,0,.57-.315,.482-.633Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 13L14.25 5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12 7.25L14.25 5 16.5 7.25"
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

export default personDressArrowUp;
