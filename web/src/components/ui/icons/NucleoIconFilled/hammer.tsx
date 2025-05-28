import React from 'react';

import type { iconProps } from './iconProps';

function hammer(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hammer';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.108,10.5l-.356,5.703c-.013,.207,.06,.41,.202,.561,.142,.151,.339,.236,.546,.236h5c.207,0,.405-.085,.546-.236,.142-.151,.215-.354,.202-.561l-.356-5.703H6.108Z"
          fill="currentColor"
        />
        <path
          d="M16.715,5.911l-4.75-3.75c-.132-.104-.296-.161-.465-.161H2.75c-.965,0-1.75,.785-1.75,1.75v3.5c0,.965,.785,1.75,1.75,1.75h13.5c.414,0,.75-.336,.75-.75v-1.75c0-.229-.105-.446-.285-.589Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hammer;
