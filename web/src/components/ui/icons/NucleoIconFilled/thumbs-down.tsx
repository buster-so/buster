import React from 'react';

import type { iconProps } from './iconProps';

function thumbsDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px thumbs down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.81,8.546l-1.191-4.5c-.319-1.205-1.413-2.046-2.659-2.046H7.25c-1.516,0-2.75,1.233-2.75,2.75v5.756c0,.659,.237,1.297,.669,1.797l4.264,4.937c.146,.169,.355,.26,.568,.26,.113,0,.228-.026,.335-.079,1.197-.599,1.751-1.998,1.289-3.254l-.798-2.167h3.326c.86,0,1.654-.391,2.179-1.073,.524-.682,.699-1.549,.479-2.381Z"
          fill="currentColor"
        />
        <path
          d="M4.25,12h-1.5c-.965,0-1.75-.785-1.75-1.75V3.75c0-.965,.785-1.75,1.75-1.75h1.5c.965,0,1.75,.785,1.75,1.75v6.5c0,.965-.785,1.75-1.75,1.75ZM2.75,3.5c-.138,0-.25,.112-.25,.25v6.5c0,.138,.112,.25,.25,.25h1.5c.138,0,.25-.112,.25-.25V3.75c0-.138-.112-.25-.25-.25h-1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default thumbsDown;
