import React from 'react';

import type { iconProps } from './iconProps';

function alignTidyUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px align tidy up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="1em" width="5" fill="currentColor" rx="1.75" ry="1.75" x="6.5" y="3" />
        <rect height="1em" width="5" fill="currentColor" rx="1.75" ry="1.75" y="3" />
        <rect height="1em" width="5" fill="currentColor" rx="1.75" ry="1.75" x="13" y="3" />
      </g>
    </svg>
  );
}

export default alignTidyUp;
