import React from 'react';

import type { iconProps } from './iconProps';

function sortAlphaDescending(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sort alpha descending';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.53,10.72c-.293-.293-.768-.293-1.061,0l-1.47,1.47V3.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V12.189l-1.47-1.47c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M5.977,1.734c-.11-.292-.39-.484-.701-.484h-.573c-.312,0-.591,.193-.701,.484L1.92,7.234c-.146,.388,.049,.82,.436,.967,.392,.146,.821-.049,.967-.436l.384-1.016h2.564l.384,1.016c.113,.3,.398,.484,.701,.484,.088,0,.178-.016,.266-.048,.387-.147,.582-.58,.436-.967L5.977,1.734Zm-1.703,3.516l.714-1.888,.715,1.888h-1.429Z"
          fill="currentColor"
        />
        <path
          d="M7.146,14.75h-2.772l3.362-4.287c.178-.226,.21-.533,.085-.791-.126-.258-.388-.422-.675-.422H2.832c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.772l-3.362,4.287c-.178,.226-.21,.533-.085,.791,.126,.258,.388,.422,.675,.422H7.146c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sortAlphaDescending;
