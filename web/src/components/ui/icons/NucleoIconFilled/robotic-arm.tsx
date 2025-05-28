import React from 'react';

import type { iconProps } from './iconProps';

function roboticArm(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px robotic arm';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.337,14.513c-.314,0-.607-.199-.711-.513l-2.284-6.854c-.131-.393,.082-.818,.474-.949,.393-.131,.818,.082,.949,.474l2.284,6.854c.131,.393-.082,.818-.474,.949-.079,.026-.159,.039-.237,.039Z"
          fill="currentColor"
        />
        <path
          d="M15.068,6.772l-2.416,.604-1.063-2.126,1.063-2.126,2.416,.604c.404,.101,.81-.144,.91-.545,.101-.402-.144-.809-.545-.91l-3-.75c-.345-.085-.696,.078-.853,.392l-1.293,2.585H6.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.036l1.293,2.585c.129,.258,.392,.415,.671,.415,.06,0,.121-.007,.182-.022l3-.75c.402-.101,.646-.508,.545-.91-.1-.401-.508-.646-.91-.545Z"
          fill="currentColor"
        />
        <circle cx="4.5" cy="5.25" fill="currentColor" r="2.25" />
        <rect height="3" width="14" fill="currentColor" rx="1.5" ry="1.5" x="2" y="13" />
      </g>
    </svg>
  );
}

export default roboticArm;
