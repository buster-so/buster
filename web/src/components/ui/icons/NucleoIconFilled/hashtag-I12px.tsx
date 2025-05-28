import React from 'react';

import type { iconProps } from './iconProps';

function hashtag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hashtag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,7H3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,12.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H14.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M5.29,16c-.046,0-.093-.004-.14-.013-.406-.077-.675-.468-.599-.875L6.896,2.612c.076-.407,.467-.677,.876-.599,.406,.077,.675,.468,.599,.875l-2.344,12.5c-.067,.36-.383,.612-.736,.612Z"
          fill="currentColor"
        />
        <path
          d="M10.368,16c-.046,0-.093-.004-.14-.013-.406-.077-.675-.468-.599-.875L11.974,2.612c.076-.407,.466-.677,.876-.599,.406,.077,.675,.468,.599,.875l-2.344,12.5c-.067,.36-.383,.612-.736,.612Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hashtag;
