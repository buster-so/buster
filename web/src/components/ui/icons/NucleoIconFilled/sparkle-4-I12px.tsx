import React from 'react';

import type { iconProps } from './iconProps';

function sparkle4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sparkle 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.025,8.303l-4.535-1.793-1.793-4.535c-.227-.572-1.168-.572-1.395,0l-1.793,4.535-4.535,1.793c-.286,.113-.475,.39-.475,.697s.188,.584,.475,.697l4.535,1.793,1.793,4.535c.113,.286,.39,.474,.697,.474s.584-.188,.697-.474l1.793-4.535,4.535-1.793c.286-.113,.475-.39,.475-.697s-.188-.584-.475-.697Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sparkle4;
