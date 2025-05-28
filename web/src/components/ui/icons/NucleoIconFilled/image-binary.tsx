import React from 'react';

import type { iconProps } from './iconProps';

function imageBinary(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image binary';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.75" cy="7.25" fill="currentColor" r="1.25" />
        <path
          d="M14.75,16c-1.495,0-2.5-1.306-2.5-3.25s1.005-3.25,2.5-3.25,2.5,1.306,2.5,3.25-1.005,3.25-2.5,3.25Zm0-5c-.79,0-1,1.1-1,1.75s.21,1.75,1,1.75,1-1.1,1-1.75-.21-1.75-1-1.75Z"
          fill="currentColor"
        />
        <path
          d="M14.75,8.5c-.414,0-.75-.336-.75-.75v-3.333c-.261,.134-.56,.246-.897,.31-.406,.074-.8-.189-.877-.596s.189-.8,.596-.877c.843-.161,1.263-.851,1.28-.88,.173-.29,.521-.432,.846-.343,.325,.09,.553,.382,.553,.72V7.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.75,17c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v14.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10,14.051v-5.753c-.271-.097-.575-.034-.78,.172L3.7,13.99c-.665-.028-1.2-.568-1.2-1.24V5.25c0-.689,.561-1.25,1.25-1.25h6c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75h6.25v-1.449Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default imageBinary;
