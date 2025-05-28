import React from 'react';

import type { iconProps } from './iconProps';

function userHistory(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user history';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="7.75" fill="currentColor" r="2.75" />
        <path
          d="M9,11.5c-2.027,0-3.828,1.313-4.476,3.196,1.233,.97,2.785,1.554,4.476,1.554s3.242-.583,4.475-1.553c-.657-1.891-2.453-3.197-4.475-3.197Z"
          fill="currentColor"
        />
        <path
          d="M9,1c-2.497,0-4.764,1.142-6.26,3.043l-.117-.841c-.057-.41-.436-.697-.846-.64-.41,.057-.697,.435-.64,.846l.408,2.945c.052,.375,.373,.647,.742,.647,.034,0,.069-.002,.104-.007l2.944-.407c.411-.057,.697-.436,.641-.846-.057-.41-.439-.692-.846-.641l-1.475,.204c1.203-1.749,3.172-2.804,5.345-2.804,3.584,0,6.5,2.916,6.5,6.5s-2.916,6.5-6.5,6.5-6.5-2.916-6.5-6.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,4.411,3.589,8,8,8s8-3.589,8-8S13.411,1,9,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userHistory;
