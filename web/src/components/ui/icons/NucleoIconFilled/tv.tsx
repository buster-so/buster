import React from 'react';

import type { iconProps } from './iconProps';

function tv(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tv';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,13H3.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75H14.25c1.517,0,2.75,1.233,2.75,2.75v5.5c0,1.517-1.233,2.75-2.75,2.75ZM3.75,3.5c-.689,0-1.25,.561-1.25,1.25v5.5c0,.689,.561,1.25,1.25,1.25H14.25c.689,0,1.25-.561,1.25-1.25V4.75c0-.689-.561-1.25-1.25-1.25H3.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,16.25c-.085,0-.172-.015-.257-.045-2.568-.935-5.418-.935-7.986,0-.391,.143-.819-.059-.962-.448-.142-.39,.06-.82,.448-.961,2.898-1.056,6.115-1.056,9.014,0,.389,.142,.59,.572,.448,.961-.111,.304-.398,.493-.705,.493Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tv;
