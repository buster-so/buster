import React from 'react';

import type { iconProps } from './iconProps';

function tagMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tag minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.75,6.5h-5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.811,8h-4.061c-1.24,0-2.25-1.009-2.25-2.25,0-1.104,.801-2.02,1.851-2.21l-1.235-1.235c-.52-.52-1.21-.806-1.944-.806H3.25c-.965,0-1.75,.785-1.75,1.75v4.921c0,.735,.286,1.425,.806,1.945l5.75,5.75c.536,.536,1.24,.804,1.944,.804s1.408-.268,1.944-.804l3.922-3.922c.52-.519,.806-1.209,.806-1.944s-.286-1.425-.806-1.944l-.056-.056Zm-9.561-.5c-.689,0-1.25-.561-1.25-1.25s.561-1.25,1.25-1.25,1.25,.561,1.25,1.25-.561,1.25-1.25,1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tagMinus;
