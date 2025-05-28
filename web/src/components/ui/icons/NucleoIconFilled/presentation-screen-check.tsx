import React from 'react';

import type { iconProps } from './iconProps';

function presentationScreenCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px presentation screen check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,17c-.078,0-.158-.012-.237-.039-.393-.131-.605-.556-.475-.949l1-3c.131-.392,.551-.606,.949-.474,.393,.131,.605,.556,.475,.949l-1,3c-.105,.314-.397,.513-.712,.513Z"
          fill="currentColor"
        />
        <path
          d="M12.25,17c-.314,0-.606-.199-.712-.513l-1-3c-.131-.393,.082-.818,.475-.949,.396-.133,.817,.082,.949,.474l1,3c.131,.393-.082,.818-.475,.949-.079,.026-.159,.039-.237,.039Z"
          fill="currentColor"
        />
        <path
          d="M9,3.5c-.414,0-.75-.336-.75-.75V1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-2.148,4.202l-3.397,4.5c-.128,.169-.322,.277-.533,.295-.022,.002-.044,.003-.065,.003-.189,0-.372-.071-.512-.202l-1.608-1.5c-.303-.282-.319-.757-.037-1.06,.285-.303,.759-.318,1.061-.037l1,.932,2.896-3.836c.25-.33,.719-.397,1.051-.146,.33,.25,.396,.72,.146,1.051Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default presentationScreenCheck;
