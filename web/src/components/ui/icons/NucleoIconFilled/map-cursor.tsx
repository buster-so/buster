import React from 'react';

import type { iconProps } from './iconProps';

function mapCursor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px map cursor';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.654,11.898c-.341-.937-.116-1.954,.587-2.657,.479-.479,1.113-.742,1.785-.742,.297,0,.59,.052,.871,.154l5.103,1.865V4.997c0-.534-.239-1.031-.655-1.365s-.953-.46-1.475-.343l-2.999,.666c-.047,.01-.094,.007-.139-.009l-4.952-1.801c-.314-.114-.653-.136-.978-.063l-3.432,.762c-.807,.179-1.371,.882-1.371,1.708V13.003c0,.534,.239,1.031,.655,1.365s.953,.46,1.475,.343l2.999-.666c.047-.01,.095-.007,.139,.009l3.661,1.331-1.274-3.488Z"
          fill="currentColor"
        />
        <path
          d="M17.324,12.233l-5.94-2.17h0c-.38-.139-.794-.047-1.081,.239-.286,.286-.378,.701-.239,1.082l2.17,5.94c.148,.407,.536,.676,.967,.676h.021c.44-.009,.826-.296,.96-.716l.752-2.351,2.352-.752c.419-.134,.706-.52,.715-.96,.008-.44-.263-.837-.676-.988Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mapCursor;
