import React from 'react';

import type { iconProps } from './iconProps';

function faceKissHeartEyes(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face kiss heart eyes';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75,13.875c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.709,10.445c.117,.073,.267,.073,.384,0,.575-.358,2.24-1.532,2.24-3.133,.003-.715-.592-1.298-1.33-1.302-.444,.006-.856,.223-1.103,.58-.247-.358-.659-.575-1.103-.58-.738,.004-1.332,.587-1.33,1.302,0,1.601,1.666,2.776,2.24,3.133Z"
          fill="currentColor"
        />
        <path
          d="M12.291,10.445c-.117,.073-.267,.073-.384,0-.575-.358-2.24-1.532-2.24-3.133-.003-.715,.592-1.298,1.33-1.302,.444,.006,.856,.223,1.103,.58,.247-.358,.659-.575,1.103-.58,.738,.004,1.332,.587,1.33,1.302,0,1.601-1.666,2.776-2.24,3.133Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceKissHeartEyes;
