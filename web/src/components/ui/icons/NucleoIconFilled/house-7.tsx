import React from 'react';

import type { iconProps } from './iconProps';

function house7(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house 7';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.45,6.4L9.45,1.15c-.268-.2-.633-.2-.9,0l-3.05,2.287v-1.187c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.312l-2.45,1.838c-.331,.249-.398,.719-.149,1.05,.247,.331,.718,.399,1.05,.15L9,2.688l6.55,4.913c.135,.101,.293,.15,.449,.15,.229,0,.454-.104,.601-.3,.249-.332,.182-.802-.149-1.05Z"
          fill="currentColor"
        />
        <path
          d="M16.25,15.5h-1.25v-6.5l-6-4.438L3,9.045v6.455H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H7.5v-3.75c0-.689,.561-1.25,1.25-1.25h.5c.689,0,1.25,.561,1.25,1.25v3.75h5.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Zm-6.25-5.9c0,.221-.179,.4-.4,.4h-1.2c-.221,0-.4-.179-.4-.4v-1.2c0-.221,.179-.4,.4-.4h1.2c.221,0,.4,.179,.4,.4v1.2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default house7;
