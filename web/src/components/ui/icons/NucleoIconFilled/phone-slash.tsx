import React from 'react';

import type { iconProps } from './iconProps';

function phoneSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px phone slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.479,11.232l-2.926-1.299c-.416-.185-.868-.174-1.275-.028l-4.252,4.252c1.981,1.468,4.326,2.469,6.872,2.827,.08,.011,.158,.016,.236,.016,.774,0,1.468-.522,1.669-1.29l.642-2.476c.211-.817-.195-1.659-.966-2.002Z"
          fill="currentColor"
        />
        <path
          d="M5.313,12.687l2.026-2.026c-.55-.551-1.044-1.158-1.472-1.813l1.705-1.358c.609-.488,.813-1.327,.497-2.04l-1.3-2.928c-.343-.772-1.185-1.178-2.004-.967l-2.476,.643c-.846,.22-1.393,1.04-1.273,1.907,.467,3.324,2.024,6.311,4.296,8.583Z"
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

export default phoneSlash;
