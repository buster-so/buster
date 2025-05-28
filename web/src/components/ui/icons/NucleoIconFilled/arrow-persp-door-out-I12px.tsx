import React from 'react';

import type { iconProps } from './iconProps';

function arrowPerspDoorOut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow persp door out';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.216,1.745c-.467-.327-1.066-.407-1.603-.211l-3.5,1.273c-.689,.25-1.152,.911-1.152,1.644v2.3h1.25c1.241,0,2.25,1.009,2.25,2.25s-1.009,2.25-2.25,2.25h-1.25v2.3c0,.733,.463,1.394,1.152,1.644l3.5,1.273c.194,.07,.396,.105,.597,.105,.355,0,.707-.108,1.005-.317,.467-.327,.746-.863,.746-1.433V3.178c0-.57-.279-1.106-.746-1.433Z"
          fill="currentColor"
        />
        <path
          d="M10.212,8.25H4.522l2.22-2.22c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-3.5,3.5c-.293,.293-.293,.768,0,1.061l3.5,3.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.22-2.22h5.689c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowPerspDoorOut;
