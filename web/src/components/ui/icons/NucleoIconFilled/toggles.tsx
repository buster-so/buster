import React from 'react';

import type { iconProps } from './iconProps';

function toggles(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px toggles';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.25,13.25c0-1.31,.844-2.411,2.014-2.821-.036-.076-.079-.149-.14-.209-.141-.141-.331-.22-.53-.22H5.25c-1.792,0-3.25,1.458-3.25,3.25s1.458,3.25,3.25,3.25h5.341c.298,0,.551-.177,.672-.43-1.169-.409-2.013-1.511-2.013-2.82Z"
          fill="currentColor"
        />
        <path
          d="M12.25,17c-2.068,0-3.75-1.682-3.75-3.75s1.682-3.75,3.75-3.75,3.75,1.682,3.75,3.75-1.682,3.75-3.75,3.75Zm0-6c-1.241,0-2.25,1.009-2.25,2.25s1.009,2.25,2.25,2.25,2.25-1.009,2.25-2.25-1.009-2.25-2.25-2.25Z"
          fill="currentColor"
        />
        <path
          d="M12.75,8H7.408v-1.5h5.342c.965,0,1.75-.785,1.75-1.75s-.785-1.75-1.75-1.75H7.408V1.5h5.342c1.792,0,3.25,1.458,3.25,3.25s-1.458,3.25-3.25,3.25Z"
          fill="currentColor"
        />
        <path
          d="M5.75,8.5c-2.068,0-3.75-1.682-3.75-3.75S3.682,1,5.75,1s3.75,1.682,3.75,3.75-1.682,3.75-3.75,3.75Zm0-6c-1.241,0-2.25,1.009-2.25,2.25s1.009,2.25,2.25,2.25,2.25-1.009,2.25-2.25-1.009-2.25-2.25-2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default toggles;
