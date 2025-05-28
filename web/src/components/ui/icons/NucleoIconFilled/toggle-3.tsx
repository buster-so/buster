import React from 'react';

import type { iconProps } from './iconProps';

function toggle3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px toggle 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,3.5H6c-.414,0-.75,.336-.75,.75v.076c.246-.039,.493-.076,.75-.076,2.623,0,4.75,2.127,4.75,4.75s-2.127,4.75-4.75,4.75c-.257,0-.504-.036-.75-.076v.076c0,.414,.336,.75,.75,.75h6c3.033,0,5.5-2.467,5.5-5.5s-2.467-5.5-5.5-5.5Z"
          fill="currentColor"
        />
        <path
          d="M6,14.5c-3.033,0-5.5-2.467-5.5-5.5S2.967,3.5,6,3.5s5.5,2.467,5.5,5.5-2.467,5.5-5.5,5.5Zm0-9.5c-2.206,0-4,1.794-4,4s1.794,4,4,4,4-1.794,4-4-1.794-4-4-4Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default toggle3;
