import React from 'react';

import type { iconProps } from './iconProps';

function plug(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px plug';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,4h-1.75V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.25H7V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.25h-1.75c-.965,0-1.75,.785-1.75,1.75v1.75c0,3.606,2.742,6.583,6.25,6.958v1.792c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.792c3.508-.376,6.25-3.352,6.25-6.958v-1.75c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default plug;
