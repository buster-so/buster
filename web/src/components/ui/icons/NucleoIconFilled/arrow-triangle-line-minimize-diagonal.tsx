import React from 'react';

import type { iconProps } from './iconProps';

function arrowTriangleLineMinimizeDiagonal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow triangle line minimize diagonal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7,10H3.104c-.405,0-.768,.242-.924,.617-.155,.375-.07,.802,.217,1.09l1.418,1.418-1.595,1.595c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.595-1.595,1.417,1.417c.191,.192,.446,.294,.707,.294,.129,0,.259-.025,.383-.076,.376-.155,.618-.518,.618-.924v-3.896c0-.551-.448-1-1-1Z"
          fill="currentColor"
        />
        <path
          d="M15.78,2.22c-.293-.293-.768-.293-1.061,0l-1.595,1.595-1.417-1.417c-.286-.287-.715-.374-1.09-.218-.376,.155-.618,.518-.618,.924v3.896c0,.551,.448,1,1,1h3.896c.405,0,.768-.242,.924-.617,.155-.375,.07-.802-.217-1.09l-1.418-1.418,1.595-1.595c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowTriangleLineMinimizeDiagonal;
