import React from 'react';

import type { iconProps } from './iconProps';

function aperture(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px aperture';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm5.468,4.5h-5.757l1.648-2.854c1.72,.368,3.187,1.419,4.109,2.854Zm-5.766-2.985l-2.878,4.985-1.644-2.847c1.128-1.25,2.73-2.057,4.522-2.139ZM3.234,6.012l2.88,4.988H2.818c-.205-.631-.318-1.302-.318-2,0-1.077,.268-2.092,.734-2.988Zm.298,6.488h5.757l-1.648,2.854c-1.72-.368-3.187-1.419-4.109-2.854Zm5.766,2.985l2.878-4.985,1.644,2.847c-1.128,1.25-2.73,2.057-4.522,2.139Zm5.469-3.497l-2.88-4.988h3.295c.205,.631,.318,1.302,.318,2,0,1.077-.268,2.092-.734,2.988Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default aperture;
