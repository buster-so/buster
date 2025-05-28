import React from 'react';

import type { iconProps } from './iconProps';

function mapAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px map alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.75,14.308c.301-.175,.5-.496,.5-.86V4.997c0-.64-.592-1.115-1.217-.976l-2.998,.666c-.186,.041-.38,.029-.559-.036l-4.952-1.801c-.179-.065-.373-.078-.559-.036l-3.432,.763c-.458,.102-.783,.508-.783,.976V13.003c0,.64,.592,1.115,1.217,.976l2.998-.666c.186-.041,.38-.029,.559,.036l4.226,1.537"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 15L13.25 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="13.25" cy="17.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default mapAlert;
