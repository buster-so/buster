import React from 'react';

import type { iconProps } from './iconProps';

function vShapedArrowDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px v shaped arrow down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.828,6.88l-5.828,3.963L3.172,6.88c-.344-.234-.81-.144-1.042,.198-.233,.343-.145,.809,.198,1.042l6.25,4.25c.127,.086,.274,.13,.422,.13s.295-.043,.422-.13l6.25-4.25c.343-.233,.432-.699,.198-1.042-.233-.342-.7-.433-1.042-.198Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default vShapedArrowDown;
