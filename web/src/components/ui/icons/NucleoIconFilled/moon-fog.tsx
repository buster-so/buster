import React from 'react';

import type { iconProps } from './iconProps';

function moonFog(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px moon fog';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.25,14H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,17h-5.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.705,9.723c-.246-.184-.579-.197-.838-.037-.868,.532-1.859,.813-2.867,.813-3.033,0-5.5-2.467-5.5-5.5,0-1.146,.354-2.247,1.023-3.186,.177-.249,.186-.581,.021-.839-.164-.257-.467-.386-.77-.334C3.994,1.347,1.25,4.652,1.25,8.5c0,.877,.147,1.719,.409,2.509,.031-.001,.06-.009,.091-.009h7.5c1.241,0,2.25,1.009,2.25,2.25,0,.264-.054,.514-.138,.75h2.888c.239,0,.466,.048,.682,.117,.964-.977,1.689-2.204,2.053-3.603,.077-.296-.034-.609-.28-.791Z"
          fill="currentColor"
        />
        <path
          d="M5.75,17h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default moonFog;
