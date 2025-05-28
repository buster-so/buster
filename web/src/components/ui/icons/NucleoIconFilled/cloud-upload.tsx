import React from 'react';

import type { iconProps } from './iconProps';

function cloudUpload(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud upload';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.146,6.327c-.442-2.463-2.611-4.327-5.146-4.327-2.895,0-5.25,2.355-5.25,5.25,0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,2.068,1.682,3.75,3.75,3.75h7.75c2.481,0,4.5-2.019,4.5-4.5,0-1.854-1.15-3.503-2.854-4.173Zm-2.366,3.204c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-.97-.97v3.189c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3.189l-.97,.97c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061l2.25-2.25c.293-.293,.768-.293,1.061,0l2.25,2.25c.293,.293,.293,.768,0,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloudUpload;
