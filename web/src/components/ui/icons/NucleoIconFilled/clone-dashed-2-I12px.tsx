import React from 'react';

import type { iconProps } from './iconProps';

function cloneDashed2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clone dashed 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="12.5" width="12.5" fill="currentColor" rx="2.75" ry="2.75" x="4.5" y="4.5" />
        <path
          d="M12.604,3.75c-.296,0-.577-.177-.695-.468-.192-.475-.647-.782-1.159-.782-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c1.126,0,2.127,.674,2.55,1.718,.155,.384-.03,.821-.414,.977-.092,.037-.188,.055-.281,.055Z"
          fill="currentColor"
        />
        <path
          d="M8.25,2.5h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M1.75,4.5c-.414,0-.75-.336-.75-.75,0-1.517,1.233-2.75,2.75-2.75,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75c-.689,0-1.25,.561-1.25,1.25,0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M1.75,9c-.414,0-.75-.336-.75-.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M3,13.354c-.094,0-.189-.018-.281-.055-1.044-.423-1.719-1.423-1.719-2.55,0-.414,.336-.75,.75-.75s.75,.336,.75,.75c0,.512,.307,.967,.781,1.159,.384,.156,.569,.593,.414,.977-.118,.292-.399,.469-.695,.469Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloneDashed2;
