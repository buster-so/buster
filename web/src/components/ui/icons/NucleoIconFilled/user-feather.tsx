import React from 'react';

import type { iconProps } from './iconProps';

function userFeather(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user feather';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M12.654,10.045c-1.08-.664-2.335-1.045-3.654-1.045-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.464,.461,2.977,.706,4.504,.75,.229-1.905,1.389-5.048,4.137-6.936Z"
          fill="currentColor"
        />
        <path
          d="M17.916,10.405c-.14-.27-.417-.428-.731-.402-6.354,.556-7.172,7.096-7.18,7.162-.047,.412,.249,.783,.66,.83,.029,.003,.058,.005,.086,.005,.376,0,.7-.282,.744-.665,.004-.039,.029-.231,.093-.524,.087-.422,.26-1.017,.605-1.724,.12-.248,.421-.351,.668-.231,.248,.121,.352,.42,.23,.668-.18,.37-.3,.695-.387,.976h.797c3.05,0,3.419-1.985,3.688-3.435,.133-.713,.258-1.386,.634-1.831,.196-.232,.233-.56,.094-.83Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userFeather;
