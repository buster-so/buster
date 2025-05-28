import React from 'react';

import type { iconProps } from './iconProps';

function arrowPerspDoorIn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow persp door in';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.254,1.745c-.467-.327-1.065-.407-1.603-.211l-3.5,1.273c-.689,.25-1.152,.911-1.152,1.644v.118l2.841,2.841c.425,.425,.659,.99,.659,1.591s-.234,1.166-.659,1.591l-2.841,2.841v.118c0,.733,.463,1.394,1.152,1.644l3.5,1.273c.194,.07,.396,.105,.597,.105,.355,0,.707-.108,1.005-.317,.467-.327,.746-.863,.746-1.433V3.178c0-.57-.279-1.106-.746-1.433Z"
          fill="currentColor"
        />
        <path
          d="M10.78,8.47l-3.5-3.5c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.22,2.22H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5.689l-2.22,2.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.5-3.5c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowPerspDoorIn;
