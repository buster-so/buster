import React from 'react';

import type { iconProps } from './iconProps';

function clothesHanger(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clothes hanger';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.205,15.5H2.795c-.563,0-1.058-.36-1.231-.895-.173-.536,.017-1.117,.473-1.446l6.213-4.5v-1.409c0-.414,.336-.75,.75-.75,.827,0,1.5-.673,1.5-1.5s-.673-1.5-1.5-1.5-1.5,.673-1.5,1.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-1.654,1.346-3,3-3s3,1.346,3,3c0,1.396-.958,2.571-2.25,2.905v1.136c0,.241-.115,.466-.31,.607L3.432,14H14.568l-3.994-2.893c-.335-.243-.411-.712-.167-1.047,.242-.336,.712-.411,1.047-.167l4.51,3.266c.456,.33,.646,.911,.472,1.446-.173,.535-.668,.895-1.231,.895Zm-.121-1.126h0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clothesHanger;
