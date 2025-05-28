import React from 'react';

import type { iconProps } from './iconProps';

function walletContent(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wallet content';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,6H4.25c-.689,0-1.25-.561-1.25-1.25s.561-1.25,1.25-1.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.75c.965,0,1.75-.785,1.75-1.75V7.75c0-.965-.785-1.75-1.75-1.75Zm-2,6.25c-.689,0-1.25-.561-1.25-1.25s.561-1.25,1.25-1.25,1.25,.561,1.25,1.25-.561,1.25-1.25,1.25Z"
          fill="currentColor"
        />
        <path
          d="M6.03,5.005c-.111,0-.223-.024-.329-.076-.372-.182-.526-.631-.344-1.003l1.207-2.466c.203-.418,.559-.734,1-.888,.444-.153,.917-.125,1.337,.079l6.014,2.917c.373,.181,.528,.629,.348,1.002-.181,.373-.629,.528-1.002,.348l-6.015-2.917c-.081-.04-.153-.024-.191-.011-.037,.013-.104,.046-.143,.127l-1.208,2.468c-.13,.266-.397,.42-.674,.42Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default walletContent;
