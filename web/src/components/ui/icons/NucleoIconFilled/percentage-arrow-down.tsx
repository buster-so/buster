import React from 'react';

import type { iconProps } from './iconProps';

function percentageArrowDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px percentage arrow down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,6.5c-1.24,0-2.25,1.009-2.25,2.25s1.01,2.25,2.25,2.25,2.25-1.009,2.25-2.25-1.01-2.25-2.25-2.25Zm0,3c-.413,0-.75-.336-.75-.75s.337-.75,.75-.75,.75,.336,.75,.75-.337,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M8.75,5.5c1.24,0,2.25-1.009,2.25-2.25s-1.01-2.25-2.25-2.25-2.25,1.009-2.25,2.25,1.01,2.25,2.25,2.25Zm0-3c.413,0,.75,.336,.75,.75s-.337,.75-.75,.75-.75-.336-.75-.75,.337-.75,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.183,1.137c-.34-.24-.808-.159-1.045,.18l-6,8.5c-.239,.338-.158,.807,.18,1.045,.132,.093,.282,.137,.432,.137,.235,0,.468-.11,.613-.317L15.362,2.183c.239-.338,.158-.807-.18-1.045Z"
          fill="currentColor"
        />
        <path
          d="M6.72,12.72l-1.72,1.72V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V14.439l-1.72-1.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3,3c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3-3c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default percentageArrowDown;
