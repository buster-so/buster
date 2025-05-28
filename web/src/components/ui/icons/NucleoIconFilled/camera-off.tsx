import React from 'react';

import type { iconProps } from './iconProps';

function cameraOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px camera off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.98,9.202c-.101,1.493-1.285,2.676-2.778,2.777l-3.02,3.021H14.25c1.517,0,2.75-1.233,2.75-2.75V5.75c0-.453-.121-.875-.316-1.252l-4.705,4.705Z"
          fill="currentColor"
        />
        <path
          d="M3.089,14.911l3.789-3.789c-.543-.543-.879-1.293-.879-2.121,0-1.657,1.343-3,3-3,.828,0,1.578,.336,2.121,.879l3.789-3.789c-.213-.053-.432-.089-.661-.089h-1.73l-.324-.864c-.254-.68-.913-1.136-1.639-1.136h-3.114c-.726,0-1.384,.457-1.638,1.136l-.324,.864h-1.73c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.288,.893,2.363,2.089,2.661Zm.911-9.911c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Z"
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

export default cameraOff;
