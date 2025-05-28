import React from 'react';

import type { iconProps } from './iconProps';

function axisX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px axis x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16,10H8V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V10.439L1.22,15.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l5.28-5.28h8.439c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M13.763,13.975c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l1.944-1.945-1.944-1.945c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.475,2.475c.293,.293,.293,.768,0,1.061l-2.475,2.475c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default axisX;
