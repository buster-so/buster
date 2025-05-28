import React from 'react';

import type { iconProps } from './iconProps';

function crosshairs2Slash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px crosshairs 2 slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.25,9.75H1.038c.178,1.907,1.028,3.62,2.31,4.902L14.652,3.348c-1.282-1.282-2.996-2.131-4.902-2.31V3.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V1.038c-3.813,.356-6.855,3.399-7.212,7.212H3.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.75,8.25h2.212c-.104-1.109-.44-2.148-.951-3.08L5.17,16.011c.931,.51,1.971,.847,3.08,.95v-2.212c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.212c3.813-.356,6.855-3.399,7.212-7.212h-2.212c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default crosshairs2Slash;
