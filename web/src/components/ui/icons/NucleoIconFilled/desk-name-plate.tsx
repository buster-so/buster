import React from 'react';

import type { iconProps } from './iconProps';

function deskNamePlate(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px desk name plate';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.6,14h-.166c-.547,0-1.053-.249-1.387-.683-.334-.434-.445-.986-.305-1.515l1.696-6.409c.106-.4,.518-.638,.917-.533,.4,.106,.639,.517,.533,.917l-1.696,6.409c-.027,.104,.016,.18,.043,.216,.028,.037,.091,.098,.198,.098h.166c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17.258,11.802l-1.721-6.5c-.203-.767-.899-1.302-1.692-1.302H4.164c-.547,0-1.053,.249-1.386,.683-.334,.434-.445,.986-.305,1.515l1.72,6.5c.203,.767,.899,1.302,1.692,1.302H15.566c.547,0,1.053-.249,1.387-.683,.334-.434,.445-.986,.305-1.515ZM6.115,7.75c0-.414,.336-.75,.75-.75h5.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H6.865c-.414,0-.75-.336-.75-.75Zm7,3.25H7.615c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default deskNamePlate;
