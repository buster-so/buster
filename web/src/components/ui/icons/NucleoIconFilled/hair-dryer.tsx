import React from 'react';

import type { iconProps } from './iconProps';

function hairDryer(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hair dryer';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,13c-.237,0-.471-.016-.701-.042l.829,2.961c.154,.55,.647,.914,1.198,.913,.076,0,.152-.006,.229-.021l.918-.167c.656-.12,1.103-.731,1.016-1.392l-.367-2.814c-1.089,.321-2.206,.561-3.123,.561Z"
          fill="currentColor"
        />
        <path
          d="M16.435,2.718c-.356-.232-.799-.269-1.186-.099l-2.994,1.31c-1.047-.467-4.487-1.929-6.505-1.929C3.131,2,1,4.131,1,6.75s2.131,4.75,4.75,4.75c2.018,0,5.459-1.462,6.505-1.929l2.994,1.31c.161,.071,.332,.105,.502,.105,.239,0,.477-.069,.684-.204,.354-.232,.565-.623,.565-1.046V3.765c0-.423-.212-.814-.565-1.046ZM5.75,8c-.69,0-1.25-.56-1.25-1.25s.56-1.25,1.25-1.25,1.25,.56,1.25,1.25-.56,1.25-1.25,1.25Zm9.75,1.353l-2.5-1.094v-3.019l2.5-1.094v5.206Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hairDryer;
