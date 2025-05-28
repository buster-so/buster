import React from 'react';

import type { iconProps } from './iconProps';

function paperPlane3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paper plane 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.078,13.649L10.124,2.183c-.219-.421-.649-.683-1.124-.683s-.905,.262-1.124,.683L1.922,13.649c-.234,.452-.177,.997,.147,1.389,.245,.297,.604,.461,.977,.461,.12,0,.241-.017,.36-.052l4.844-1.435v-4.898c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.898l4.844,1.435c.489,.146,1.013-.016,1.337-.409,.324-.392,.382-.938,.147-1.389Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paperPlane3;
