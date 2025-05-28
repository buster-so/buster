import React from 'react';

import type { iconProps } from './iconProps';

function paragraphSpacing(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paragraph spacing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.22,8.72l-.47,.47v-3.379l.47,.47c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.75-1.75c-.293-.293-.768-.293-1.061,0l-1.75,1.75c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l.47-.47v3.379l-.47-.47c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.75,1.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.75-1.75c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M15.25,2.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,17H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,14H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paragraphSpacing;
