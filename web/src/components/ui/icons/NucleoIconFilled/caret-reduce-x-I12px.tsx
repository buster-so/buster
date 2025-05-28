import React from 'react';

import type { iconProps } from './iconProps';

function caretReduceX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret reduce x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.836,5.548c-.409-.217-.901-.191-1.287,.069l-3.469,2.349c-.344,.233-.548,.62-.548,1.035s.204,.802,.548,1.035h0s3.47,2.349,3.47,2.349c.211,.143,.455,.215,.7,.215,.2,0,.401-.049,.586-.146,.41-.217,.664-.641,.664-1.104V6.652c0-.463-.254-.887-.664-1.104Z"
          fill="currentColor"
        />
        <path
          d="M7.92,7.965l-3.47-2.348c-.383-.26-.876-.286-1.286-.069s-.664,.641-.664,1.104v4.696c0,.463,.254,.887,.664,1.104,.185,.098,.386,.146,.586,.146,.245,0,.489-.072,.701-.215l3.469-2.348h0c.344-.233,.548-.62,.548-1.035s-.204-.802-.548-1.035Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default caretReduceX;
