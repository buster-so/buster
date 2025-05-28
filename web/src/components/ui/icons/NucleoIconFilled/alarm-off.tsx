import React from 'react';

import type { iconProps } from './iconProps';

function alarmOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px alarm off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,9v-3.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5l4.197-4.197c-1.268-1.268-3.018-2.053-4.947-2.053-3.859,0-7,3.14-7,7,0,1.93,.785,3.68,2.053,4.947l4.417-4.417c-.136-.136-.22-.323-.22-.53Z"
          fill="currentColor"
        />
        <path
          d="M1.5,4.25c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L2.97,.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2,2c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M14.447,13.387c.969-1.201,1.553-2.727,1.553-4.387,0-1.11-.267-2.156-.728-3.09L5.91,15.271c.933,.462,1.98,.729,3.09,.729,1.66,0,3.185-.583,4.386-1.553l1.333,1.333c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.333-1.333Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default alarmOff;
