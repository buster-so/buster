import React from 'react';

import type { iconProps } from './iconProps';

function cryptography(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cryptography';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="7.25"
          cy="6.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="10.75"
          cy="11.75"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,6.5v5.381c0,.265-.105,.52-.293,.707l-3.369,3.369c-.188,.188-.442,.293-.707,.293H5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,10.25v2.336c0,.265,.105,.52,.293,.707l.707,.707"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25,14.25l.792-1.025c.135-.175,.208-.39,.208-.611v-3.177c0-.279,.116-.545,.321-.734l1.566-1.45"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25,7.75v-2.336c0-.265-.105-.52-.293-.707l-.707-.707"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,3.75l-.792,1.025c-.135,.175-.208,.39-.208,.611v3.177c0,.279-.116,.545-.321,.734l-1.566,1.45"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,1.75H6.119c-.265,0-.52,.105-.707,.293l-3.369,3.369c-.188,.188-.293,.442-.293,.707v5.381"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default cryptography;
