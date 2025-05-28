import React from 'react';

import type { iconProps } from './iconProps';

function vShapedArrowRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px v shaped arrow right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.12,2.328c-.232-.342-.699-.433-1.042-.198-.343,.233-.432,.699-.198,1.042l3.963,5.828-3.963,5.828c-.233,.343-.145,.809,.198,1.042,.129,.088,.276,.13,.421,.13,.24,0,.476-.115,.621-.328l4.25-6.25c.173-.255,.173-.589,0-.844L8.12,2.328Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default vShapedArrowRight;
