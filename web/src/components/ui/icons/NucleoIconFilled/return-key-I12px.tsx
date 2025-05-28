import React from 'react';

import type { iconProps } from './iconProps';

function returnKey(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px return key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-.25,7.25c0,.965-.785,1.75-1.75,1.75H6.561l.72,.72c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-2-2c-.293-.293-.293-.768,0-1.061l2-2c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-.72,.72h5.689c.138,0,.25-.112,.25-.25v-2c0-.138-.112-.25-.25-.25h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.965,0,1.75,.785,1.75,1.75v2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default returnKey;
