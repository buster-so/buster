import React from 'react';

import type { iconProps } from './iconProps';

function tag2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tag 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.866,8.056L10.116,2.306c-.52-.52-1.21-.806-1.945-.806H3.25c-.965,0-1.75,.785-1.75,1.75v4.921c0,.735,.286,1.425,.806,1.945l2.194,2.194v3.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V7.449c-.566-.119-1-.598-1-1.199,0-.69,.56-1.25,1.25-1.25s1.25,.56,1.25,1.25V15.311l.556,.556c.519,.52,1.21,.805,1.944,.805s1.425-.286,1.944-.805l3.922-3.922c.52-.519,.805-1.21,.805-1.944s-.286-1.425-.805-1.944Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tag2;
