import React from 'react';

import type { iconProps } from './iconProps';

function chartHistogram(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart histogram';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,15.5H4.75c-1.517,0-2.75-1.233-2.75-2.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V12.75c0,.689,.561,1.25,1.25,1.25H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,11.5c-.054,0-.109-.006-.165-.018-2.021-.454-2.632-2.136-3.123-3.488-.525-1.447-.809-1.994-1.713-1.994-.893,0-1.177,.545-1.704,1.989-.494,1.354-1.109,3.039-3.132,3.493-.404,.09-.805-.164-.896-.568-.09-.404,.164-.805,.568-.896,1.141-.256,1.536-1.131,2.051-2.543,.484-1.325,1.086-2.975,3.113-2.975,2.041,0,2.641,1.653,3.123,2.982,.511,1.408,.904,2.281,2.041,2.536,.404,.091,.658,.492,.568,.896-.079,.349-.388,.586-.731,.586Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartHistogram;
