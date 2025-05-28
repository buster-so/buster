import React from 'react';

import type { iconProps } from './iconProps';

function linkSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px link slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.75,11.423c.352-.168,.682-.398,.973-.69l.01-.01c.426-.426,.721-.934,.884-1.473"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.384,6.617c-.164-.322-.381-.624-.65-.893l-2.425-2.425c-1.381-1.381-3.619-1.381-5,0l-.01,.01c-1.381,1.381-1.381,3.619,0,5l.931,.931"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75,11.423c.352-.168,.682-.398,.973-.69l.01-.01c.492-.492,.808-1.092,.95-1.723"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.616,11.383c.164,.322,.381,.624,.65,.893l2.425,2.425c1.381,1.381,3.619,1.381,5,0l.01-.01c1.381-1.381,1.381-3.619,0-5l-.931-.931"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25,6.577c-.352,.168-.682,.398-.973,.69l-.01,.01c-.492,.492-.808,1.092-.95,1.723"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default linkSlash;
