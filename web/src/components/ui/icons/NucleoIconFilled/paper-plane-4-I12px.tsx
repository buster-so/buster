import React from 'react';

import type { iconProps } from './iconProps';

function paperPlane4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paper plane 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.817,7.876L4.351,1.922c-.453-.234-.997-.175-1.39,.148-.392,.324-.552,.849-.408,1.336l1.435,4.844h4.898c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H3.988l-1.435,4.844c-.145,.488,.016,1.012,.408,1.336,.232,.191,.518,.29,.806,.29,.199,0,.399-.047,.584-.143l11.466-5.954c.421-.219,.683-.649,.683-1.124s-.262-.905-.683-1.124Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paperPlane4;
