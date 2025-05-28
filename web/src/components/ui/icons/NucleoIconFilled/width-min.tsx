import React from 'react';

import type { iconProps } from './iconProps';

function widthMin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px width min';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.25,1.5c-.414,0-.75,.336-.75,.75V7.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M10.25,1.5c-.414,0-.75,.336-.75,.75V7.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.28,2.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.72,.72h-1.189c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.189l-.72,.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2-2c.293-.293,.293-.768,0-1.061l-2-2Z"
          fill="currentColor"
        />
        <path
          d="M14.75,9.5H3.25c-.965,0-1.75,.785-1.75,1.75v3c0,.965,.785,1.75,1.75,1.75h1.25v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5h1v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5h1v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5h1v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5h1.25c.965,0,1.75-.785,1.75-1.75v-3c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default widthMin;
