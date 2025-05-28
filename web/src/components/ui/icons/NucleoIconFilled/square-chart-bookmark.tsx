import React from 'react';

import type { iconProps } from './iconProps';

function squareChartBookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square chart bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,9.5c-.297,0-.587-.058-.861-.171-.844-.35-1.389-1.166-1.389-2.079V2.5H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.75c0,1.517,1.233,2.75,2.75,2.75H12.25c1.517,0,2.75-1.233,2.75-2.75v-5.568l-.659,.659c-.425,.425-.99,.659-1.591,.659Zm-7.25,3.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-4.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.25Zm3.25,0c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V6.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5Zm3.25,0c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2Z"
          fill="currentColor"
        />
        <path
          d="M16.25,0h-2.5c-.965,0-1.75,.785-1.75,1.75V7.25c0,.303,.183,.577,.463,.693s.603,.052,.817-.163l1.72-1.72,1.72,1.72c.144,.144,.335,.22,.53,.22,.097,0,.194-.019,.287-.057,.28-.116,.463-.39,.463-.693V1.75c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareChartBookmark;
