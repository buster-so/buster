import React from 'react';

import type { iconProps } from './iconProps';

function boxArchive2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box archive 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.85,4.3l-2.25-3c-.142-.188-.364-.3-.6-.3H5c-.236,0-.458,.111-.6,.3l-2.25,3c-.249,.332-.181,.802,.15,1.05,.333,.249,.802,.182,1.05-.15l2.025-2.7h2.875v2.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.5h2.875l2.025,2.7c.147,.196,.373,.3,.601,.3,.157,0,.314-.049,.45-.15,.331-.249,.398-.719,.15-1.05Z"
          fill="currentColor"
        />
        <path
          d="M13.25,17H4.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-.414,.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75V14.25c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default boxArchive2;
