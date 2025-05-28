import React from 'react';

import type { iconProps } from './iconProps';

function houseUser2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house user 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,11c-1.517,0-2.75-1.233-2.75-2.75s1.233-2.75,2.75-2.75,2.75,1.233,2.75,2.75-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M4.381,15.713c.12,.022,.243,.037,.369,.037H13.25c.126,0,.249-.015,.369-.037-.003-.051-.006-.101-.019-.15-.54-2.098-2.432-3.563-4.6-3.563s-4.06,1.465-4.6,3.563c-.013,.049-.017,.099-.019,.15Z"
          fill="currentColor"
        />
        <path
          d="M13.25,17H4.75c-1.517,0-2.75-1.233-2.75-2.75V6.996c0-.542,.258-1.063,.689-1.393,0,0,0,0,0,0L7.94,1.613c.626-.474,1.496-.472,2.118,0l5.251,3.99c.433,.331,.69,.852,.69,1.394v7.254c0,1.517-1.233,2.75-2.75,2.75ZM3.599,6.796c-.062,.048-.099,.122-.099,.2v7.254c0,.689,.561,1.25,1.25,1.25H13.25c.689,0,1.25-.561,1.25-1.25V6.996c0-.078-.037-.153-.1-.2l-5.249-3.989c-.089-.067-.211-.069-.304,0L3.599,6.796Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default houseUser2;
