import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.586,8.004L10.005,3.011c-.38-.288-.883-.335-1.311-.124-.429,.213-.694,.642-.694,1.12v1.993H2.75c-.965,0-1.75,.785-1.75,1.75v2.5c0,.965,.785,1.75,1.75,1.75h5.25v1.993c0,.478,.266,.907,.694,1.12,.177,.088,.368,.131,.557,.131,.267,0,.531-.086,.754-.255l6.581-4.994c.314-.238,.494-.601,.494-.996s-.18-.757-.494-.996Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowBoldRight;
