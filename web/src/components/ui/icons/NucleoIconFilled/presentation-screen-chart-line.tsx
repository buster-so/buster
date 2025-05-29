import type { iconProps } from './iconProps';

function presentationScreenChartLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px presentation screen chart line';

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
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-.97,5.28l-2.146,2.146c-.486,.487-1.281,.487-1.768,0l-1.616-1.616-1.97,1.97c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l2.146-2.146c.486-.487,1.281-.487,1.768,0l1.616,1.616,1.97-1.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default presentationScreenChartLine;
