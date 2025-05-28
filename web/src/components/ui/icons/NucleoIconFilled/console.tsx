import React from 'react';

import type { iconProps } from './iconProps';

function console(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px console';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM6.03,12.28c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l2.22-2.22-2.22-2.22c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.75,2.75c.293,.293,.293,.768,0,1.061l-2.75,2.75Zm6.47,.22h-2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm0-2.75h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm0-2.75h-2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default console;
