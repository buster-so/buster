import React from 'react';

import type { iconProps } from './iconProps';

function baloonHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baloon heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.302,18c-.192,0-.384-.073-.53-.22-.723-.723-.723-1.898,0-2.621l.372-.376c.093-.093,.106-.198,.106-.253s-.013-.16-.104-.25c-.293-.293-.293-.768,0-1.061,.293-.293,.769-.292,1.061,0,.351,.35,.543,.815,.543,1.311s-.193,.961-.543,1.311l-.371,.375c-.141,.141-.141,.365-.003,.503,.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M12.051,1c-1.151,.015-2.238,.464-3.051,1.237-.813-.772-1.903-1.222-3.064-1.237-2.455,.015-4.444,2.002-4.436,4.428,0,5.032,5.128,8.066,6.702,8.877,.25,.129,.524,.194,.798,.194s.547-.064,.797-.193c1.572-.81,6.703-3.845,6.703-8.875,.009-2.429-1.981-4.417-4.449-4.431Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default baloonHeart;
