import React from 'react';

import type { iconProps } from './iconProps';

function merge(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px merge';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,8.25h-6.318l-1.956-3.377c-.49-.847-1.402-1.373-2.38-1.373H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.847c.445,0,.859,.239,1.082,.624l1.955,3.376-1.955,3.376c-.223,.385-.637,.624-1.082,.624H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.847c.978,0,1.89-.526,2.38-1.372l1.956-3.378h6.318v-1.5Z"
          fill="currentColor"
        />
        <path
          d="M13.5,12.5c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.22-2.22-2.22-2.22c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.75,2.75c.293,.293,.293,.768,0,1.061l-2.75,2.75c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default merge;
