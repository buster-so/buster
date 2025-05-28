import React from 'react';

import type { iconProps } from './iconProps';

function carElectric(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px car electric';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,13.25v1.5c0,.276,.224,.5,.5,.5h1c.276,0,.5-.224,.5-.5v-1.5H1.75Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,13.25v1.5c0,.276,.224,.5,.5,.5h1c.276,0,.5-.224,.5-.5v-1.5h-2Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.5 7.75L16.5 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.5 10.75L10.5 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.347,2.856c-.601,.203-1.085,.686-1.275,1.319l-1.072,3.575-.664,.664c-.375,.375-.586,.884-.586,1.414v3.422h14.5v-3.422c0-.531-.211-1.039-.586-1.414l-.664-.664-1.072-3.575c-.181-.603-.634-1.059-1.196-1.278"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.939,2.761c-.088-.161-.256-.261-.439-.261h-1.102l.526-1.864c.067-.238-.05-.489-.275-.591-.225-.102-.492-.024-.626,.184l-1.942,3c-.099,.154-.107,.35-.02,.511,.088,.161,.256,.261,.439,.261h1.102l-.526,1.864c-.067,.238,.05,.489,.275,.591,.066,.03,.137,.044,.206,.044,.165,0,.325-.082,.42-.228l1.942-3c.099-.154,.107-.35,.02-.511Z"
          fill="currentColor"
        />
        <circle cx="4.25" cy="10.25" fill="currentColor" r=".75" />
        <circle cx="13.75" cy="10.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default carElectric;
