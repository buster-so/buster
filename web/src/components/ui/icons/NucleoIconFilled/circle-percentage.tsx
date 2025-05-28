import React from 'react';

import type { iconProps } from './iconProps';

function circlePercentage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle percentage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-2.25,4.5c.69,0,1.25,.56,1.25,1.25s-.56,1.25-1.25,1.25-1.25-.56-1.25-1.25,.56-1.25,1.25-1.25Zm4.5,7c-.69,0-1.25-.56-1.25-1.25s.56-1.25,1.25-1.25,1.25,.56,1.25,1.25-.56,1.25-1.25,1.25Zm1.03-5.72l-5.5,5.5c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l5.5-5.5c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circlePercentage;
