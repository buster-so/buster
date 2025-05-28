import React from 'react';

import type { iconProps } from './iconProps';

function glassesHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px glasses heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.332,9.723l1.614-4.647c.446-1.243,1.953-1.721,3.034-.961"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.668,9.723l-1.614-4.647c-.446-1.243-1.953-1.721-3.034-.961"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.29,10.763c-.108-.587-.643-1.013-1.29-1.013-.647,0-1.183,.426-1.29,1.013"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.281,14.197c.138,.071,.299,.071,.437,0,.729-.374,3.031-1.73,3.031-3.934,.004-.968-.791-1.757-1.777-1.763-.593,.007-1.144,.301-1.473,.786-.329-.484-.881-.778-1.473-.786-.985,.006-1.78,.794-1.777,1.763,0,2.205,2.303,3.56,3.031,3.934Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.719,14.197c-.138,.071-.299,.071-.437,0-.729-.374-3.031-1.73-3.031-3.934-.004-.968,.791-1.757,1.777-1.763,.593,.007,1.144,.301,1.473,.786,.329-.484,.881-.778,1.473-.786,.985,.006,1.78,.794,1.777,1.763,0,2.205-2.303,3.56-3.031,3.934Z"
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

export default glassesHeart;
