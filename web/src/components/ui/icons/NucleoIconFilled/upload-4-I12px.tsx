import React from 'react';

import type { iconProps } from './iconProps';

function upload4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px upload 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,11c-.414,0-.75,.336-.75,.75v1.5c0,.689-.561,1.25-1.25,1.25H4.75c-.689,0-1.25-.561-1.25-1.25v-1.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.5c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75v-1.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.03,6.78l2.22-2.22v5.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.561l2.22,2.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-3.5-3.5c-.293-.293-.768-.293-1.061,0l-3.5,3.5c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default upload4;
