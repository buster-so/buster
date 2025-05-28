import React from 'react';

import type { iconProps } from './iconProps';

function mapAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px map alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.345,3.632c-.416-.333-.952-.459-1.474-.343l-3.001,.666c-.047,.01-.095,.007-.138-.009l-4.953-1.802c-.314-.113-.649-.136-.977-.062l-3.432,.762c-.808,.179-1.371,.882-1.371,1.708V13.003c0,.534,.238,1.031,.655,1.365,.416,.333,.952,.459,1.474,.343l3.001-.666c.047-.01,.095-.007,.138,.009l4.925,1.792c-.112-.263-.193-.542-.193-.846v-2.75c0-1.241,1.01-2.25,2.25-2.25s2.25,1.009,2.25,2.25v2.75c0,.066-.021,.126-.027,.191l.156-.035c.808-.179,1.371-.882,1.371-1.708V4.997c0-.534-.238-1.031-.655-1.365Z"
          fill="currentColor"
        />
        <path
          d="M13.25,11.5c-.414,0-.75,.336-.75,.75v2.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <circle cx="13.25" cy="17.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default mapAlert;
