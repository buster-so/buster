import React from 'react';

import type { iconProps } from './iconProps';

function circleOpenArrowUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle open arrow up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9c0,4.158,3.19,7.582,7.25,7.962V7.561l-1.97,1.97c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061l3.25-3.25c.293-.293,.768-.293,1.061,0l3.25,3.25c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-1.97-1.97v9.401c4.06-.38,7.25-3.804,7.25-7.962,0-4.411-3.589-8-8-8Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleOpenArrowUp;
