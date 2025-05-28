import React from 'react';

import type { iconProps } from './iconProps';

function axis(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px axis';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25 10L8 10 8 1.75 6.5 1.75 6.5 10.439 1.22 15.72 2.28 16.78 7.561 11.5 16.25 11.5 16.25 10z"
          fill="currentColor"
        />
        <path
          d="M5.25,17H1.75c-.414,0-.75-.336-.75-.75v-3.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.75h2.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.725,4.987c-.192,0-.384-.073-.53-.22l-1.945-1.944-1.945,1.944c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061L6.72,1.232c.293-.293,.768-.293,1.061,0l2.475,2.475c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
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

export default axis;
