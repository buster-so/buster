import React from 'react';

import type { iconProps } from './iconProps';

function mapClock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px map clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.5,14c0-3.033,2.468-5.5,5.5-5.5,1.107,0,2.136,.332,3,.896V4.997c0-.534-.238-1.031-.655-1.365-.416-.334-.953-.459-1.474-.343l-3.001,.666c-.047,.01-.095,.007-.138-.009l-4.953-1.802c-.314-.113-.649-.136-.977-.062l-3.432,.762c-.808,.179-1.371,.882-1.371,1.708V13.003c0,.534,.238,1.031,.655,1.365,.416,.334,.952,.46,1.474,.343l3.001-.666c.047-.01,.095-.007,.138,.009l2.312,.841c-.048-.292-.08-.59-.08-.895Z"
          fill="currentColor"
        />
        <path
          d="M14,10c-2.206,0-4,1.794-4,4s1.794,4,4,4,4-1.794,4-4-1.794-4-4-4Zm2.312,4.95c-.119,.29-.398,.465-.693,.465-.096,0-.191-.018-.285-.056l-1.619-.665c-.281-.116-.465-.39-.465-.694v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.247l1.154,.474c.383,.157,.566,.596,.408,.979Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mapClock;
