import React from 'react';

import type { iconProps } from './iconProps';

function circleSortArrows(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle sort arrows';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm2.151,9.991l-1.695,1.978c-.24,.28-.672,.28-.911,0l-1.695-1.978c-.334-.389-.057-.991,.456-.991h3.39c.513,0,.789,.602,.456,.991Zm-.456-2.991h-3.39c-.513,0-.789-.602-.456-.991l1.695-1.978c.24-.28,.672-.28,.911,0l1.695,1.978c.334,.389,.057,.991-.456,.991Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleSortArrows;
