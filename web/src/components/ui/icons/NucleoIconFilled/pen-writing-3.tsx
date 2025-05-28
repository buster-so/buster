import React from 'react';

import type { iconProps } from './iconProps';

function penWriting3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pen writing 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.875,15.999c-.69,0-1.38-.263-1.905-.788-.451-.451-1.238-.451-1.689,0-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061c1.051-1.051,2.76-1.051,3.811,0,.465,.465,1.225,.465,1.689,0,.294-.294,.769-.292,1.061,0s.293,.768,0,1.061c-.525,.525-1.215,.788-1.905,.788Z"
          fill="currentColor"
        />
        <path
          d="M11.414,2.848L3.605,10.657c-.862,.863-1.401,3.406-1.594,4.459-.044,.242,.034,.49,.208,.665,.142,.142,.333,.22,.53,.22,.045,0,.09-.004,.134-.012,1.053-.191,3.595-.729,4.46-1.593l7.808-7.809c1.03-1.03,1.03-2.708,0-3.738-.998-.998-2.739-.998-3.737,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default penWriting3;
