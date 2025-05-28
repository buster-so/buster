import React from 'react';

import type { iconProps } from './iconProps';

function temperatureDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px temperature down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.5,10.017V4.25c0-1.792-1.458-3.25-3.25-3.25s-3.25,1.458-3.25,3.25v5.767c-.647,.766-1,1.725-1,2.733,0,2.343,1.907,4.25,4.25,4.25s4.25-1.907,4.25-4.25c0-1.008-.353-1.967-1-2.733Zm-3.25,4.233c-.828,0-1.5-.672-1.5-1.5,0-.554,.304-1.032,.75-1.292v-2.208c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.208c.446,.26,.75,.738,.75,1.292,0,.828-.672,1.5-1.5,1.5Z"
          fill="currentColor"
        />
        <path
          d="M16.78,7.22c-.293-.293-.768-.293-1.061,0l-1.22,1.22V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v5.689l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default temperatureDown;
