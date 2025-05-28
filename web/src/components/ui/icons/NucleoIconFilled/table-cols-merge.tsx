import React from 'react';

import type { iconProps } from './iconProps';

function tableColsMerge(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table cols merge';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,13.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.75h3.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75h-3.5v2.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2h-3.5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h3.5v-2.75Zm-.47-2.53c.293,.293,.293,.768,0,1.061s-.768,.293-1.061,0l-2.25-2.25c-.146-.146-.22-.338-.22-.53s.073-.384,.22-.53l2.25-2.25c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-.97,.97h4.379l-.97-.97c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.25,2.25c.293,.293,.293,.768,0,1.061l-2.25,2.25c-.293,.293-.768,.293-1.061,0-.146-.146-.22-.338-.22-.53s.073-.384,.22-.53l.97-.97H6.811l.97,.97Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableColsMerge;
