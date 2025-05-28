import React from 'react';

import type { iconProps } from './iconProps';

function nail(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px nail';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.75,15.5h-3.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,17c-.414,0-.75-.336-.75-.75V7.5c0-1.473-.806-2.822-2.104-3.522-.364-.197-.5-.652-.304-1.017,.196-.364,.651-.501,1.017-.304,1.783,.962,2.891,2.818,2.891,4.843v8.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M4.25,17c-.414,0-.75-.336-.75-.75V7.5c0-2.019,1.103-3.872,2.879-4.836,.365-.198,.819-.062,1.017,.301,.197,.364,.062,.819-.302,1.017-1.291,.701-2.094,2.049-2.094,3.518v8.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.065,.752c-.807-.415-1.568-.502-2.065-.502-.729,0-1.431,.173-2.088,.515-.562,.293-.912,.882-.912,1.537V7.75c0,1.517,1.233,2.75,2.75,2.75h.5c1.517,0,2.75-1.233,2.75-2.75V2.305c0-.65-.366-1.259-.935-1.553Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default nail;
