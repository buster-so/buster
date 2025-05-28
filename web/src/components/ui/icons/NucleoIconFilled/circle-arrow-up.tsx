import React from 'react';

import type { iconProps } from './iconProps';

function circleArrowUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle arrow up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm3.03,7.78c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-1.22-1.22v4.689c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V7.561l-1.22,1.22c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061l2.5-2.5c.293-.293,.768-.293,1.061,0l2.5,2.5c.293,.293,.293,.768,0,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleArrowUp;
