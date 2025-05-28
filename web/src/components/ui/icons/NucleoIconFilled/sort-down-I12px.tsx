import React from 'react';

import type { iconProps } from './iconProps';

function sortDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sort down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.273,11.241c-.204-.457-.642-.741-1.142-.741H5.868c-.5,0-.938,.284-1.142,.741-.203,.457-.123,.971,.211,1.343l3.131,3.5h0c.237,.265,.577,.417,.932,.417s.694-.151,.932-.417l3.131-3.499c.334-.373,.414-.887,.211-1.344Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sortDown;
