import React from 'react';

import type { iconProps } from './iconProps';

function brainNodes2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px brain nodes 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.31,9.81l1.397,1.397c.188,.188,.293,.442,.293,.707v1.586"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.69,8.19l-1.397-1.397c-.188-.188-.293-.442-.293-.707v-1.586"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.743,9.619c-.353-.128-.661-.342-.909-.619"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.257,9.619c.353-.128,.661-.342,.909-.619"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.5c0-1.243-1.007-2.25-2.25-2.25s-2.25,1.007-2.25,2.25c0,.27,.055,.525,.142,.764-.048-.003-.094-.014-.142-.014-1.243,0-2.25,1.007-2.25,2.25,0,.579,.225,1.101,.584,1.5-.359,.399-.584,.921-.584,1.5,0,1.243,1.007,2.25,2.25,2.25,.049,0,.094-.011,.142-.014-.087,.24-.142,.495-.142,.764,0,1.243,1.007,2.25,2.25,2.25s2.25-1.007,2.25-2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.642,12.736c.357-.022,.691-.123,.983-.289"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.774,6.149c.257-.244,.459-.552,.584-.885"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.226,6.149c-.257-.244-.459-.552-.584-.885"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.5c0-1.243,1.007-2.25,2.25-2.25s2.25,1.007,2.25,2.25c0,.27-.055,.525-.142,.764,.048-.003,.094-.014,.142-.014,1.243,0,2.25,1.007,2.25,2.25,0,.579-.225,1.101-.584,1.5,.359,.399,.584,.921,.584,1.5,0,1.243-1.007,2.25-2.25,2.25-.049,0-.094-.011-.142-.014,.087,.24,.142,.495,.142,.764,0,1.243-1.007,2.25-2.25,2.25s-2.25-1.007-2.25-2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.358,12.736c-.357-.022-.691-.123-.983-.289"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7" cy="9.5" fill="currentColor" r="1.5" />
        <circle cx="11" cy="8.5" fill="currentColor" r="1.5" />
      </g>
    </svg>
  );
}

export default brainNodes2;
