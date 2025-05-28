import React from 'react';

import type { iconProps } from './iconProps';

function people(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px people';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="4.12"
          cy="2.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.406"
          cy="2.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.12,17.25h.549c.533,0,.972-.418,.999-.95l.202-4.05,1.256-.359c.271-.077,.424-.363,.339-.631l-1.17-3.704c-.114-.359-.424-.624-.795-.689-.547-.095-1.013-.118-1.38-.114-.367-.004-.833,.019-1.38,.114-.371,.065-.682,.33-.795,.689l-1.17,3.704c-.085,.268,.069,.554,.339,.631l1.256,.359,.202,4.05c.027,.532,.466,.95,.999,.95h.549Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.232,13.617l-1.662-6.026c-.104-.375-.408-.658-.792-.723-.398-.067-.859-.115-1.371-.115s-.972,.048-1.371,.115c-.384,.065-.689,.347-.792,.723-.554,2.009-1.108,4.018-1.662,6.026-.088,.318,.152,.633,.482,.633h1.593s.174,2.083,.174,2.083c.043,.518,.476,.917,.997,.917h1.16c.52,0,.953-.399,.997-.917l.174-2.083h1.593c.33,0,.57-.315,.482-.633Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default people;
