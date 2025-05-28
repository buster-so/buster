import React from 'react';

import type { iconProps } from './iconProps';

function shapePolygon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shape polygon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.558,1.549c-.917-.737-2.198-.737-3.116,0L2.434,5.57c-.758,.608-1.095,1.612-.859,2.556l1.489,5.981c.278,1.115,1.272,1.893,2.418,1.893h7.036c1.146,0,2.14-.778,2.418-1.894l1.489-5.98c.236-.944-.102-1.948-.859-2.557L10.558,1.549Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shapePolygon;
