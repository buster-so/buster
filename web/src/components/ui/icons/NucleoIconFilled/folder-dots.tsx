import React from 'react';

import type { iconProps } from './iconProps';

function folderDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="14" cy="15" fill="currentColor" r="1" />
        <circle cx="11" cy="15" fill="currentColor" r="1" />
        <circle cx="17" cy="15" fill="currentColor" r="1" />
        <path
          d="M8.5,15c0-1.378,1.121-2.5,2.5-2.5,.565,0,1.081,.195,1.5,.513,.419-.317,.935-.513,1.5-.513s1.081,.195,1.5,.513c.292-.221,.628-.386,1-.462V6.25c0-1.516-1.233-2.75-2.75-2.75h-5.026l-.378-.471c-.525-.654-1.307-1.029-2.145-1.029h-1.951c-1.517,0-2.75,1.234-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h4.462c-.135-.307-.212-.644-.212-1ZM3,6.314v-1.564c0-.689,.561-1.25,1.25-1.25h1.951c.381,0,.737,.17,.975,.467l.603,.752c.142,.177,.357,.281,.585,.281h5.386c.689,0,1.25,.561,1.25,1.25v.064c-.377-.194-.798-.314-1.25-.314H4.25c-.452,0-.873,.12-1.25,.314Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default folderDots;
