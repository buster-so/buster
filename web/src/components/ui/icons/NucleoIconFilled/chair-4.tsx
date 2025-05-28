import React from 'react';

import type { iconProps } from './iconProps';

function chair4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chair 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.605,16.09l-2.855-1.538v-3.302c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.302l-2.855,1.538c-.365,.196-.501,.651-.305,1.016,.136,.251,.394,.395,.661,.395,.12,0,.241-.029,.354-.09l2.145-1.155v.995c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.995l2.145,1.155c.113,.061,.234,.09,.354,.09,.268,0,.525-.143,.661-.395,.196-.365,.061-.819-.305-1.016Z"
          fill="currentColor"
        />
        <path
          d="M2.459,8.263c.73-.951,2.11-1.763,4.541-1.763h4c2.438,0,3.819,.817,4.547,1.772l.364-1.011c.182-.514,.202-1.059,.059-1.577C14.689,1.098,14.19,.015,9,.015S3.311,1.098,2.03,5.684c-.144,.517-.123,1.062,.062,1.587l.367,.992Z"
          fill="currentColor"
        />
        <path
          d="M11,8H7c-2.96,0-3.75,1.415-3.75,2.25,0,.965,.785,1.75,1.75,1.75H13c.965,0,1.75-.785,1.75-1.75,0-.835-.79-2.25-3.75-2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chair4;
