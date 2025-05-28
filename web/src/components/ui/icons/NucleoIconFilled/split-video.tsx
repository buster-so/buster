import React from 'react';

import type { iconProps } from './iconProps';

function splitVideo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px split video';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.75,1h-1.5c-.965,0-1.75,.785-1.75,1.75v1.5c0,.182,.066,.357,.186,.494l1.564,1.788v9.718c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V6.532l1.564-1.788c.12-.137,.186-.312,.186-.494v-1.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,14h-3.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.138,0,.25-.112,.25-.25v-2.5c0-.138-.112-.25-.25-.25h-3.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
        <path
          d="M9,8H2.75c-.965,0-1.75,.785-1.75,1.75v2.5c0,.965,.785,1.75,1.75,1.75h6.25v-6Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default splitVideo;
