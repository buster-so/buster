import React from 'react';

import type { iconProps } from './iconProps';

function bamboo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bamboo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2,4h0c1.932,0,3.5,1.568,3.5,3.5h0c0,.276-.224,.5-.5,.5h0c-1.932,0-3.5-1.568-3.5-3.5h0c0-.276,.224-.5,.5-.5Z"
          fill="currentColor"
        />
        <path
          d="M16,8h0c.276,0,.5,.224,.5,.5h0c0,1.932-1.568,3.5-3.5,3.5h0c-.276,0-.5-.224-.5-.5h0c0-1.932,1.568-3.5,3.5-3.5Z"
          fill="currentColor"
          transform="rotate(-180 14.5 10)"
        />
        <path
          d="M11.313,12.565c.004-.947,.123-1.889,.311-2.815H6.376c.187,.927,.307,1.869,.311,2.816,.005,1.179-.135,2.358-.415,3.506-.055,.224-.003,.46,.139,.641,.142,.181,.359,.287,.59,.287h4c.23,0,.448-.106,.59-.287,.142-.181,.193-.417,.139-.641-.28-1.147-.42-2.327-.415-3.506Z"
          fill="currentColor"
        />
        <path
          d="M6.687,5.435c-.004,.947-.123,1.889-.311,2.815h5.248c-.187-.927-.307-1.869-.311-2.816-.005-1.179,.135-2.358,.415-3.506,.055-.224,.003-.46-.139-.641-.142-.181-.359-.287-.59-.287H7c-.23,0-.448,.106-.59,.287-.142,.181-.193,.417-.139,.641,.28,1.147,.42,2.327,.415,3.506Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bamboo;
