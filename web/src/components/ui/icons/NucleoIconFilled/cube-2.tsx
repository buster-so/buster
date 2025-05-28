import React from 'react';

import type { iconProps } from './iconProps';

function cube2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cube 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.63,4.148L10.38,1.683c-.852-.493-1.908-.493-2.76,0L3.37,4.148c-.845,.49-1.37,1.402-1.37,2.378v4.946c0,.977,.525,1.888,1.37,2.379l4.25,2.465c.426,.247,.903,.37,1.38,.37s.954-.124,1.38-.37l4.25-2.465c.845-.49,1.37-1.402,1.37-2.378V6.527c0-.977-.525-1.888-1.37-2.379Zm-1.503,3.326l-3.376,1.958v3.927c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3.927l-3.376-1.958c-.358-.208-.48-.667-.272-1.025,.208-.358,.667-.479,1.025-.272l3.374,1.957,3.374-1.957c.358-.207,.818-.086,1.025,.272s.085,.817-.272,1.025Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cube2;
