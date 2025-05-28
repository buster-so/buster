import React from 'react';

import type { iconProps } from './iconProps';

function sortArrows(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sort arrows';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.932,1.916c-.475-.529-1.389-.529-1.863,0h0s-3.131,3.5-3.131,3.5c-.334,.373-.414,.887-.211,1.344,.204,.457,.642,.741,1.142,.741h6.264c.5,0,.938-.284,1.142-.741,.203-.457,.123-.971-.211-1.343l-3.131-3.5Z"
          fill="currentColor"
        />
        <path
          d="M12.132,10.5H5.868c-.5,0-.938,.284-1.142,.741-.203,.457-.123,.971,.211,1.343l3.131,3.5h0c.237,.265,.577,.417,.932,.417s.694-.151,.932-.417l3.131-3.499c.334-.373,.414-.887,.211-1.344-.204-.457-.642-.741-1.142-.741Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sortArrows;
