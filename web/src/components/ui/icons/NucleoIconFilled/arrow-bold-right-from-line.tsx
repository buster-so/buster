import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldRightFromLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold right from line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.634,8.022L11.028,3.559c-.379-.302-.886-.358-1.321-.148-.436,.21-.707,.642-.707,1.126v1.463h-3.25c-.965,0-1.75,.785-1.75,1.75v2.5c0,.965,.785,1.75,1.75,1.75h3.25v1.463c0,.484,.271,.916,.707,1.126,.175,.084,.361,.125,.545,.125,.276,0,.549-.093,.776-.273h0l5.605-4.463c.299-.239,.471-.595,.471-.978s-.172-.739-.471-.978Z"
          fill="currentColor"
        />
        <path
          d="M1.75,6c-.414,0-.75,.336-.75,.75v4.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V6.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowBoldRightFromLine;
