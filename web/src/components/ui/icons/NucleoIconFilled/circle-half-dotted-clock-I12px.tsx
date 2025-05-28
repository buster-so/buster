import React from 'react';

import type { iconProps } from './iconProps';

function circleHalfDottedClock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle half dotted clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.249,12c-.146,0-.296-.043-.426-.133l-3.25-2.25c-.202-.14-.323-.371-.323-.617V4.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.857l2.927,2.026c.341,.236,.426,.703,.189,1.043-.146,.21-.379,.323-.617,.323Z"
          fill="currentColor"
        />
        <path
          d="M9,17c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c3.584,0,6.5-2.916,6.5-6.5s-2.916-6.5-6.5-6.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c4.411,0,8,3.589,8,8s-3.589,8-8,8Z"
          fill="currentColor"
        />
        <circle cx="3.873" cy="14.127" fill="currentColor" r=".75" />
        <circle cx="1.75" cy="9" fill="currentColor" r=".75" />
        <circle cx="3.873" cy="3.873" fill="currentColor" r=".75" />
        <circle cx="6.226" cy="15.698" fill="currentColor" r=".75" />
        <circle cx="2.302" cy="11.774" fill="currentColor" r=".75" />
        <circle cx="2.302" cy="6.226" fill="currentColor" r=".75" />
        <circle cx="6.226" cy="2.302" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default circleHalfDottedClock;
