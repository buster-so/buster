import React from 'react';

import type { iconProps } from './iconProps';

function axisY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px axis y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,10H8V2c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V10.439L1.22,15.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l5.28-5.28h8.689c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M9.725,4.987c-.192,0-.384-.073-.53-.22l-1.945-1.944-1.945,1.944c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061L6.72,1.232c.293-.293,.768-.293,1.061,0l2.475,2.475c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default axisY;
