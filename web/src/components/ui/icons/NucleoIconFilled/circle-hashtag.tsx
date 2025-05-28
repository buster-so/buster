import React from 'react';

import type { iconProps } from './iconProps';

function circleHashtag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle hashtag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M7.951 10L9.674 10 10.049 8 8.326 8 7.951 10z" fill="currentColor" />
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm4,7h-1.424l-.375,2h1.049c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1.331l-.307,1.638c-.067,.36-.383,.612-.736,.612-.046,0-.093-.004-.14-.013-.406-.077-.675-.468-.599-.875l.255-1.362h-1.724l-.307,1.638c-.067,.36-.383,.612-.736,.612-.046,0-.093-.004-.14-.013-.406-.077-.675-.468-.599-.875l.255-1.362h-1.143c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.424l.375-2h-1.049c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.331l.307-1.638c.076-.407,.465-.679,.876-.599,.406,.077,.675,.468,.599,.875l-.255,1.362h1.724l.307-1.638c.075-.407,.466-.679,.876-.599,.406,.077,.675,.468,.599,.875l-.255,1.362h1.143c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleHashtag;
