import React from 'react';

import type { iconProps } from './iconProps';

function magnifierStar2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px magnifier star 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,16.25c-.192,0-.384-.073-.53-.22l-3.965-3.965c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.965,3.965c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M7.75,2.25c-3.171,0-5.75,2.58-5.75,5.75s2.579,5.75,5.75,5.75,5.75-2.58,5.75-5.75S10.921,2.25,7.75,2.25Zm2.628,5.237l-1.042,1.016,.245,1.434c.024,.141-.033,.283-.148,.367-.065,.048-.143,.072-.221,.072-.06,0-.12-.014-.175-.043l-1.287-.677-1.287,.677c-.127,.066-.28,.056-.396-.029-.115-.084-.173-.226-.148-.367l.245-1.434-1.042-1.016c-.103-.1-.139-.249-.095-.384s.161-.235,.303-.255l1.439-.209,.645-1.305c.125-.256,.547-.256,.672,0l.645,1.305,1.439,.209c.142,.021,.259,.12,.303,.255s.008,.285-.095,.384Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default magnifierStar2;
