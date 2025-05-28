import React from 'react';

import type { iconProps } from './iconProps';

function bottleWater(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bottle water';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.756,6.674c-.454-.939-.756-1.795-.756-2.924v-1.5c0-.965-.785-1.75-1.75-1.75h-1.5c-.965,0-1.75,.785-1.75,1.75v1.5c0,1.424-.486,2.392-1,3.417-.492,.979-1,1.992-1,3.333v5.25c0,.965,.785,1.75,1.75,1.75h3.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.138,0-.25-.112-.25-.25v-5.25c0-.986,.39-1.762,.84-2.66,.517-1.03,1.093-2.197,1.149-3.84h2.029c.047,1.365,.445,2.411,.887,3.326,.179,.373,.628,.529,1.001,.349,.373-.18,.529-.629,.349-1.001Z"
          fill="currentColor"
        />
        <path d="M6.512 10L2.75 10 2.75 14 6.8 14.03 6.512 10z" fill="currentColor" />
        <path
          d="M15.799,9.239c-.142-.152-.341-.239-.549-.239h-6.5c-.208,0-.407,.086-.549,.239-.142,.152-.214,.357-.199,.564l.434,6.072c.065,.911,.832,1.625,1.746,1.625h3.638c.914,0,1.68-.714,1.746-1.625l.434-6.071c.015-.208-.057-.412-.199-.564Zm-1.354,1.261l-.178,2.5h-4.532l-.178-2.5h4.889Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bottleWater;
