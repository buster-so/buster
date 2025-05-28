import React from 'react';

import type { iconProps } from './iconProps';

function houseSearch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house search';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.5,14c0-2.481,2.019-4.5,4.5-4.5,.722,0,1.395,.187,2,.49v-2.994c0-.543-.258-1.064-.691-1.394L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75h5.92c-.72-.798-1.17-1.843-1.17-3Z"
          fill="currentColor"
        />
        <path
          d="M16.575,15.514c.263-.446,.425-.96,.425-1.514,0-1.654-1.346-3-3-3s-3,1.346-3,3,1.346,3,3,3c.555,0,1.068-.162,1.514-.425l1.205,1.205c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.205-1.205Zm-4.075-1.514c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5c0,.413-.168,.787-.438,1.058,0,0-.002,0-.002,.002s0,.002-.002,.002c-.271,.271-.645,.438-1.058,.438-.827,0-1.5-.673-1.5-1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default houseSearch;
