import React from 'react';

import type { iconProps } from './iconProps';

function circleUserPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle user plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.25,3h-1.75V1.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M9,11.5c-2.027,0-3.828,1.313-4.476,3.196,1.233,.97,2.785,1.554,4.476,1.554s3.242-.583,4.475-1.553c-.657-1.891-2.453-3.197-4.475-3.197Z"
          fill="currentColor"
        />
        <path
          d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1c.542,0,1.085,.055,1.613,.163,.406,.083,.667,.479,.584,.885-.083,.406-.479,.667-.885,.584-.429-.088-.871-.132-1.312-.132-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5c0-.152-.005-.304-.016-.455-.027-.413,.285-.771,.698-.799,.408-.029,.771,.285,.799,.698,.012,.184,.019,.369,.019,.555,0,4.411-3.589,8-8,8Z"
          fill="currentColor"
        />
        <circle cx="9" cy="7.75" fill="currentColor" r="2.75" />
      </g>
    </svg>
  );
}

export default circleUserPlus;
