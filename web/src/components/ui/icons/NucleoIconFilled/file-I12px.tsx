import React from 'react';

import type { iconProps } from './iconProps';

function file(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.487,5.427l-3.914-3.914c-.331-.331-.77-.513-1.237-.513H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V6.664c0-.467-.182-.907-.513-1.237Zm-1.053,1.068l-.002,.005h-2.932c-.55,0-1-.45-1-1V2.579l.013-.005,3.921,3.921Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default file;
