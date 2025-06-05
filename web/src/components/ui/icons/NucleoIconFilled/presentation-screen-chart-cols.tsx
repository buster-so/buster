import type { iconProps } from './iconProps';

function presentationScreenChartCols(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px presentation screen chart cols';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,17c-.079,0-.159-.012-.237-.039-.393-.131-.605-.556-.474-.949l1-3c.13-.393,.554-.608,.949-.474,.393,.131,.605,.556,.474,.949l-1,3c-.104,.314-.397,.513-.711,.513Z"
          fill="currentColor"
        />
        <path
          d="M12.25,17c-.314,0-.607-.199-.711-.513l-1-3c-.131-.393,.081-.818,.474-.949,.393-.132,.818,.082,.949,.474l1,3c.131,.393-.081,.818-.474,.949-.079,.026-.159,.039-.237,.039Z"
          fill="currentColor"
        />
        <path
          d="M9,3.5c-.414,0-.75-.336-.75-.75V1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM7,10.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5Zm2.75,0c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V5.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.5Zm2.75,0c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default presentationScreenChartCols;
