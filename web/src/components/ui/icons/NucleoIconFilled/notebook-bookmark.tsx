import React from 'react';

import type { iconProps } from './iconProps';

function notebookBookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px notebook bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.25,0H3.75C2.233,0,1,1.233,1,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h4.5c1.517,0,2.75-1.233,2.75-2.75V2.75c0-1.517-1.233-2.75-2.75-2.75Zm-.25,5.595c0,.334-.404.501-.64.265l-1.36-1.36-1.36,1.36c-.236.236-.64.069-.64-.265V1.5h4v4.095Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default notebookBookmark;
