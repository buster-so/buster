import React from 'react';

import type { iconProps } from './iconProps';

function houseUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.309,5.603L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V6.996c0-.543-.258-1.064-.691-1.394Zm-6.309,.397c.965,0,1.75,.785,1.75,1.75s-.785,1.75-1.75,1.75-1.75-.785-1.75-1.75,.785-1.75,1.75-1.75Zm3.128,7.468c-.237,.333-.621,.532-1.027,.532H6.899c-.407,0-.791-.199-1.027-.532-.232-.328-.293-.748-.162-1.123,.488-1.402,1.811-2.345,3.291-2.345s2.802,.943,3.291,2.346c.13,.375,.07,.795-.163,1.123Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default houseUser;
