import React from 'react';

import type { iconProps } from './iconProps';

function penNib(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pen nib';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.813,8.492L10.248,1.652c-.128-.192-.303-.334-.498-.438v6.995c.446,.26,.75,.739,.75,1.291,0,.827-.673,1.5-1.5,1.5s-1.5-.673-1.5-1.5c0-.553,.304-1.031,.75-1.291V1.214c-.195,.104-.37,.246-.498,.438L3.187,8.492c-.335,.502-.386,1.155-.134,1.704l2.212,4.805h7.47l2.212-4.804c.252-.549,.201-1.202-.134-1.704Z"
          fill="currentColor"
        />
        <path
          d="M14.25,17c-.414,0-.75-.336-.75-.75v-.5c0-.138-.112-.25-.25-.25H4.75c-.138,0-.25,.112-.25,.25v.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-.5c0-.965,.785-1.75,1.75-1.75H13.25c.965,0,1.75,.785,1.75,1.75v.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default penNib;
