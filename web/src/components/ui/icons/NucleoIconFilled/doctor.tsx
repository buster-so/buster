import React from 'react';

import type { iconProps } from './iconProps';

function doctor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px doctor';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.103,1.588C10.38,.136,7.62,.136,4.897,1.588c-.245,.13-.397,.385-.397,.662V6.5c0,2.481,2.019,4.5,4.5,4.5s4.5-2.019,4.5-4.5V2.25c0-.277-.152-.531-.397-.662Zm-4.103,7.912c-1.654,0-3-1.346-3-3v-.774c2.015-.952,3.985-.952,6,0v.774c0,1.654-1.346,3-3,3Z"
          fill="currentColor"
        />
        <path
          d="M9,12c-2.413,0-4.672,1.078-6.2,2.957-.306,.376-.365,.883-.156,1.323,.212,.444,.647,.72,1.137,.72H14.219c.49,0,.925-.276,1.137-.72,.209-.44,.15-.947-.156-1.323-1.528-1.879-3.788-2.957-6.2-2.957Zm2.75,3.5h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default doctor;
