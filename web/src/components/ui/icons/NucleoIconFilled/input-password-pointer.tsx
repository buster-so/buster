import React from 'react';

import type { iconProps } from './iconProps';

function inputPasswordPointer(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px input password pointer';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5" cy="9" fill="currentColor" r="1" />
        <circle cx="8.5" cy="9" fill="currentColor" r="1" />
        <path
          d="M8.882,12.5H3.25c-.689,0-1.25-.561-1.25-1.25V6.75c0-.689,.561-1.25,1.25-1.25H13.75c.689,0,1.25,.561,1.25,1.25v3.045c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.045c0-1.517-1.233-2.75-2.75-2.75H3.25c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,1.517,1.233,2.75,2.75,2.75h5.632c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M17.324,12.233l-5.94-2.17h0c-.378-.139-.794-.047-1.081,.239-.286,.286-.378,.701-.239,1.082l2.17,5.94c.148,.407,.536,.676,.967,.676h.021c.44-.009,.826-.296,.96-.716l.752-2.351,2.352-.752c.419-.134,.706-.52,.715-.96,.008-.44-.263-.837-.676-.988Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default inputPasswordPointer;
