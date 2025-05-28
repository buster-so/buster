import React from 'react';

import type { iconProps } from './iconProps';

function restaurantMenu(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px restaurant menu';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,16c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V15.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.252,1.192c-.158-.142-.363-.208-.581-.188L3.171,2.004c-.382,.041-.671,.362-.671,.746V15.25c0,.384,.29,.706,.671,.746l9.5,1c.026,.002,.053,.004,.079,.004,.185,0,.363-.068,.502-.192,.158-.143,.248-.345,.248-.558V1.75c0-.212-.09-.415-.248-.558Zm-5.252,2.808c.828,0,1.5,.672,1.5,1.5s-.672,1.5-1.5,1.5-1.5-.672-1.5-1.5,.672-1.5,1.5-1.5Zm2,9.25c-.016,0-.031,0-.047-.001l-4-.25c-.413-.026-.728-.382-.702-.795,.026-.413,.375-.72,.795-.702l4,.25c.413,.026,.728,.382,.702,.795-.025,.397-.355,.703-.748,.703Zm0-3.25H6c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default restaurantMenu;
