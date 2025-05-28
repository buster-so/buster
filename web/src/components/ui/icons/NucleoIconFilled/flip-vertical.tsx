import React from 'react';

import type { iconProps } from './iconProps';

function flipVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flip vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="15.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="9" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="9" fill="currentColor" r=".75" />
        <path
          d="M12.132,1H5.868c-.5,0-.938,.284-1.142,.741-.203,.457-.123,.971,.211,1.343l3.131,3.5c.237,.265,.577,.416,.932,.416s.694-.151,.932-.417l3.131-3.499c.334-.373,.414-.887,.211-1.344-.204-.457-.642-.741-1.142-.741Zm-3.132,4.375l-2.572-2.875h5.145l-2.572,2.875Z"
          fill="currentColor"
        />
        <path
          d="M9.932,11.416c-.475-.529-1.389-.53-1.863,0l-3.131,3.499c-.334,.373-.414,.887-.211,1.344,.204,.457,.642,.741,1.142,.741h6.264c.5,0,.938-.284,1.142-.741,.203-.457,.123-.971-.211-1.344l-3.131-3.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default flipVertical;
